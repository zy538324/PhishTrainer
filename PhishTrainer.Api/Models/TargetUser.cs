namespace PhishTrainer.Api.Models;

public class TargetGroup : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<TargetUser> Targets { get; set; } = new();
    
    public Tenant Tenant { get; set; } = null!;
}

public class TargetUser : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int? TargetGroupId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public bool IsActive { get; set; } = true;
    
    public Tenant Tenant { get; set; } = null!;
    public TargetGroup? Group { get; set; }
}
