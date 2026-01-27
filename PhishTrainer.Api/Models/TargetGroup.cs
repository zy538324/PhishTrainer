namespace PhishTrainer.Api.Models;

/// <summary>
/// Logical group of phishing targets (e.g. department, region, pilot group)
/// used to scope campaigns.[web:302][web:8]
/// </summary>
public class TargetGroup : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public List<TargetUser> Targets { get; set; } = new();
}
