namespace PhishTrainer.Api.Services;

/// <summary>
/// Provides access to the current tenant context for the lifetime of a request.
/// Set by TenantMiddleware, used everywhere else to get the tenant id/slug.[web:79][web:401][web:68]
/// </summary>
public interface ITenantResolver
{
    /// <summary>
    /// Gets the current tenant id.
    /// Throws if the tenant has not been resolved for this request.
    /// </summary>
    int GetTenantId();

    /// <summary>
    /// Gets the current tenant slug (e.g. "acme"), if known.
    /// Optional helper for logging and downstream services.
    /// </summary>
    string? GetTenantSlug();

    /// <summary>
    /// Sets the tenant context for the current request.
    /// Intended to be called only from middleware / infrastructure.
    /// </summary>
    /// <param name="tenantId">Tenant id.</param>
    /// <param name="slug">Tenant slug.</param>
    void SetTenant(int tenantId, string slug);
}
