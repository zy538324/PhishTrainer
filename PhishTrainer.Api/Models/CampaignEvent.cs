namespace PhishTrainer.Api.Models;

/// <summary>
/// A single event in a phishing campaign lifecycle for a target user:
/// Sent, Open, Click, Submitted, Reported, Bounced, etc.[web:205][web:207][web:271]
/// </summary>
public class CampaignEvent : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    // Foreign keys
    public int CampaignId { get; set; }
    public int TargetUserId { get; set; }

    /// <summary>
    /// Event type string, e.g. Sent, Open, Click, Submitted, Reported, Bounced.[web:205][web:207]
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>UTC timestamp when the event occurred.</summary>
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional JSON metadata (IP, user agent, SMTP status, etc.).[web:165][web:268]
    /// </summary>
    public string? MetadataJson { get; set; }

    // Navigation
    public Campaign Campaign { get; set; } = null!;
    public TargetUser TargetUser { get; set; } = null!;
}
