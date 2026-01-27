namespace PhishTrainer.Api.Models;

public class Campaign : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int EmailTemplateId { get; set; }
    public int LandingPageId { get; set; }
    public int TargetGroupId { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Scheduled, Running, Completed
    public DateTime? ScheduledAt { get; set; }
    public DateTime? LaunchedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Tenant Tenant { get; set; } = null!;
    public EmailTemplate EmailTemplate { get; set; } = null!;
    public LandingPageTemplate LandingPage { get; set; } = null!;
    public TargetGroup TargetGroup { get; set; } = null!;
    public List<CampaignEvent> Events { get; set; } = new();
}
