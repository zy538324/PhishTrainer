namespace PhishTrainer.Api.DTOs;

/// <summary>
/// Generic phishing event DTO, for exposing or ingesting
/// campaign activity such as Sent, Open, Click, Submitted, Reported, Bounced.[web:205][web:207][web:249]
/// </summary>
public class EventDto
{
    /// <summary>Campaign this event belongs to.</summary>
    public int CampaignId { get; set; }

    /// <summary>Target user this event is about.</summary>
    public int TargetUserId { get; set; }

    /// <summary>
    /// Event type string, e.g. Sent, Open, Click, Submitted, Reported, Bounced.[web:205][web:207][web:251]
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>UTC timestamp when the event occurred.</summary>
    public DateTime TimestampUtc { get; set; }

    /// <summary>
    /// Optional JSON metadata (IP, user agent, geo info, counts, etc.).[web:165][web:253]
    /// </summary>
    public string? MetadataJson { get; set; }
}
