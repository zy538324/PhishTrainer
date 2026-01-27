using PhishTrainer.Api.Data;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, PhishDbContext db, ITenantResolver tenantResolver)
    {
        // Option 1: subdomain (acme.yourapp.com)
        var host = context.Request.Host.Host;
        var parts = host.Split('.');
        var slug = parts.Length > 2 ? parts[0] : "default";

        // Option 2: from JWT claim (if already authenticated)
        // var slug = context.User.FindFirst("tenant_slug")?.Value ?? "default";

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);
        if (tenant == null)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { error = "Tenant not found" });
            return;
        }

        ((TenantResolver)tenantResolver).SetTenant(tenant.Id, tenant.Slug);
        await _next(context);
    }
}
