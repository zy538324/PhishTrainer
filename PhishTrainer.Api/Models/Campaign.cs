namespace PhishTrainer.Api.Models;

/// <summary>
/// A phishing simulation campaign for a single tenant:
/// links a template, landing page, and target group, with schedule and status.[web:203][web:260]
/// </summary>
public class Campaign : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    // Basic info
    public string Name { get; set; } = string.Empty;

    // Foreign keys
    public int EmailTemplateId { get; set; }
    public int LandingPageId { get; set; }
    public int TargetGroupId { get; set; }

    /// <summary>
    /// Campaign lifecycle: Draft, Scheduled, Running, Paused, Completed.[web:165][web:225]
    /// </summary>
    public string Status { get; set; } = "Draft";

    /// <summary>When the campaign is scheduled to start (UTC), if any.</summary>
    public DateTime? ScheduledAtUtc { get; set; }

    /// <summary>When the campaign actually started sending (UTC), if any.</summary>
    public DateTime? LaunchedAtUtc { get; set; }

    /// <summary>When the campaign record was created (UTC).</summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Emails per minute for this campaign.
    /// Used to throttle sends to avoid reputation issues.[web:219][web:221]
    /// </summary>
    public int ThrottlePerMinute { get; set; } = 60;

    /// <summary>
    /// Optional override for the display name in the From header,
    /// otherwise Tenant.SmtpDisplayName / Tenant.Name is used.[web:260]
    /// </summary>
    public string? FromDisplayNameOverride { get; set; }

    /// <summary>
    /// Optional reply-to address for this campaign’s emails.[web:260]
    /// </summary>
    public string? ReplyToAddress { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public EmailTemplate EmailTemplate { get; set; } = null!;
    public LandingPageTemplate LandingPage { get; set; } = null!;
    public TargetGroup TargetGroup { get; set; } = null!;

    public List<CampaignEvent> Events { get; set; } = new();
}
