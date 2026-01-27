using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Middleware;

/// <summary>
/// Resolves the current tenant for each HTTP request.
/// Supports:
/// - X-Tenant header (for API clients)
/// - Subdomain-based tenant (e.g. acme.app.com -> "acme")
/// - Fallback to "default" tenant.
/// Caches tenant lookups in-memory for a short period.
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        PhishDbContext db,
        ITenantResolver tenantResolver,
        IMemoryCache cache)
    {
        // 1) Identify tenant slug
        var slug = ResolveTenantSlug(context);

        // 2) Fetch tenant (with small in-memory cache)
        var cacheKey = $"tenant:{slug}";
        if (!cache.TryGetValue(cacheKey, out Tenant? tenant))
        {
            tenant = await db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);

            if (tenant == null)
            {
                _logger.LogWarning("Tenant not found for slug {Slug}", slug);
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await context.Response.WriteAsJsonAsync(new { error = "Tenant not found" });
                return;
            }

            cache.Set(cacheKey, tenant, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });
        }

        // 3) Set tenant for the rest of the pipeline
        tenantResolver.SetTenant(tenant.Id, tenant.Slug);
        _logger.LogDebug("Tenant resolved: Id={TenantId}, Slug={Slug}", tenant.Id, tenant.Slug);

        await _next(context);
    }

    private static string ResolveTenantSlug(HttpContext context)
    {
        // Highest priority: explicit header (API clients / tests)
        var fromHeader = context.Request.Headers["X-Tenant"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(fromHeader))
        {
            return fromHeader.Trim().ToLowerInvariant();
        }

        // Next: query string override ?tenant=acme (useful for debugging)
        if (context.Request.Query.TryGetValue("tenant", out var tenantQuery) &&
            !string.IsNullOrWhiteSpace(tenantQuery.FirstOrDefault()))
        {
            return tenantQuery.First()!.Trim().ToLowerInvariant();
        }

        // Finally: subdomain-based (acme.app.com -> "acme")
        var host = context.Request.Host.Host;
        var parts = host.Split('.');
        if (parts.Length > 2)
        {
            return parts[0].Trim().ToLowerInvariant();
        }

        // Fallback tenant
        return "default";
    }
}
