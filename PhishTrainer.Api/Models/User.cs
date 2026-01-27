using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// Administrative user of the PhishTrainer platform for a given tenant
/// (not the simulated target user receiving phishing emails).[web:321][web:339][web:341]
/// </summary>
public class User : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(256)]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Role within the tenant, e.g. MspAdmin, TenantAdmin, Auditor, Analyst, Viewer.
    /// </summary>
    [MaxLength(64)]
    public string Role { get; set; } = "TenantAdmin";

    /// <summary>
    /// Whether this admin account is active (can sign in and manage campaigns).[web:321][web:332]
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional external Id (e.g. Azure AD object id) for SSO mapping.[web:321][web:330][web:342]
    /// </summary>
    [MaxLength(128)]
    public string? ExternalId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
