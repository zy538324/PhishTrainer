namespace PhishTrainer.Api.Models;

public class EmailTemplate : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? ImportedFrom { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Tenant Tenant { get; set; } = null!;
}
