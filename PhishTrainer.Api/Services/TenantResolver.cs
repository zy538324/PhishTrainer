namespace PhishTrainer.Api.Services;

public interface ITenantResolver
{
    int GetTenantId();
    string GetTenantSlug();
}

public class TenantResolver : ITenantResolver
{
    private int? _tenantId;
    private string? _tenantSlug;

    public void SetTenant(int tenantId, string slug)
    {
        _tenantId = tenantId;
        _tenantSlug = slug;
    }

    public int GetTenantId() => _tenantId ?? throw new InvalidOperationException("Tenant not resolved");
    public string GetTenantSlug() => _tenantSlug ?? throw new InvalidOperationException("Tenant not resolved");
}
