namespace PhishTrainer.Api.Models;

public class LandingPageTemplate : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
    public bool CollectCredentials { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Tenant Tenant { get; set; } = null!;
}
