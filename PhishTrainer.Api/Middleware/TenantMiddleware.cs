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
    // in TenantMiddleware.cs, inside InvokeAsync

// 1) Prefer explicit header if present
var slug = context.Request.Headers["X-Tenant"].FirstOrDefault();
if (string.IsNullOrWhiteSpace(slug))
{
    var host = context.Request.Host.Host;
    var parts = host.Split('.');
    slug = parts.Length > 2 ? parts[0] : "default";
}

// 2) Simple in-memory cache (per instance)
var cache = context.RequestServices.GetRequiredService<IMemoryCache>();
var cacheKey = $"tenant:{slug}";

if (!cache.TryGetValue(cacheKey, out Tenant? tenant))
{
    tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);

    if (tenant == null)
    {
        _logger.LogWarning("Tenant not found for slug: {Slug}", slug);
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(new { error = "Tenant not found" });
        return;
    }

    cache.Set(cacheKey, tenant, TimeSpan.FromMinutes(5));
}

tenantResolver.SetTenant(tenant.Id, tenant.Slug);

}

