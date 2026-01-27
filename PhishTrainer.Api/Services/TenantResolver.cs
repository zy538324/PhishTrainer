using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Services;

/// <summary>
/// Simple in-memory tenant context for the current request.
/// Set by TenantMiddleware, read by DbContext, services, controllers.[web:401][web:68][web:407]
/// </summary>
public class TenantResolver : ITenantResolver
{
    private int? _tenantId;
    private string? _slug;

    public int GetTenantId()
    {
        if (_tenantId is null)
        {
            throw new InvalidOperationException(
                "Tenant has not been resolved for this request. " +
                "Ensure TenantMiddleware runs before other middleware and controllers.");
        }

        return _tenantId.Value;
    }

    public string? GetTenantSlug() => _slug;

    public void SetTenant(int tenantId, string slug)
    {
        // Only allow setting once per request to avoid accidental overrides.
        if (_tenantId is not null && _tenantId != tenantId)
        {
            throw new InvalidOperationException(
                $"Tenant already set to id={_tenantId}, attempted to change to id={tenantId}.");
        }

        _tenantId = tenantId;
        _slug = slug;
    }
}
