namespace PhishTrainer.Api.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty; // acme
    public string? Domain { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // OAuth config per tenant
    public string? TenantIdAzure { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; } // encrypted
    public string? SmtpFromAddress { get; set; }
}
