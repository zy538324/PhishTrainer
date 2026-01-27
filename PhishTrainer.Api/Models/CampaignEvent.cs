namespace PhishTrainer.Api.Models;

public class CampaignEvent : IMustHaveTenant
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int CampaignId { get; set; }
    public int TargetUserId { get; set; }
    public string EventType { get; set; } = string.Empty; // Sent, Open, Click, Submitted, Reported
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Metadata { get; set; } // JSON: IP, UA, etc.
    
    public Campaign Campaign { get; set; } = null!;
    public TargetUser TargetUser { get; set; } = null!;
}
