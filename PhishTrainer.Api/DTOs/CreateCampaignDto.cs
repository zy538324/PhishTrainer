using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.DTOs;

/// <summary>
/// Payload used to create or configure a phishing campaign:
/// links to template, landing page, target group, schedule, and throttle.[web:213][web:215][web:216]
/// </summary>
public class CreateCampaignDto
{
    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Email template to use for this campaign.</summary>
    [Required]
    public int TemplateId { get; set; }

    /// <summary>Landing page template to use for clicks.</summary>
    [Required]
    public int LandingPageId { get; set; }

    /// <summary>Target group that will receive this campaign.</summary>
    [Required]
    public int TargetGroupId { get; set; }

    /// <summary>
    /// Optional UTC schedule time. If null, campaign is created as Draft
    /// and can be launched manually.[web:215][web:216]
    /// </summary>
    public DateTime? ScheduledAtUtc { get; set; }

    /// <summary>
    /// Emails per minute for this campaign.
    /// 0 or negative means "no throttle" (best effort send).[web:218][web:219]
    /// </summary>
    [Range(0, 10_000)]
    public int ThrottlePerMinute { get; set; } = 60;
}
