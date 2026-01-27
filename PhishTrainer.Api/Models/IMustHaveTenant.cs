namespace PhishTrainer.Api.Models;

/// <summary>
/// Marker interface for entities that are owned by a specific tenant.
/// Any entity implementing this will be automatically filtered by TenantId
/// via the DbContext's global query filters.[web:79][web:70][web:284]
/// </summary>
public interface IMustHaveTenant
{
    /// <summary>
    /// Identifier of the tenant that owns this record.
    /// </summary>
    int TenantId { get; set; }
}
