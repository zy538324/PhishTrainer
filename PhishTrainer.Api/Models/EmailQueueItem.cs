using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// A queued email waiting to be sent by the background worker.
/// </summary>
public class EmailQueueItem : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }
    [MaxLength(64)]
    public string TenantSlug { get; set; } = string.Empty;

    // Campaign context
    public int CampaignId { get; set; }
    public int TargetUserId { get; set; }

    [MaxLength(256)]
    public string ToAddress { get; set; } = string.Empty;

    [MaxLength(256)]
    public string Subject { get; set; } = string.Empty;

    public string HtmlBody { get; set; } = string.Empty;
    public string TrackingToken { get; set; } = string.Empty;

    public EmailQueueStatus Status { get; set; } = EmailQueueStatus.Pending;
    public int Attempts { get; set; } = 0;
    public int MaxAttempts { get; set; } = 5;

    public DateTime ScheduledAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastAttemptAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }

    [MaxLength(1024)]
    public string? LastError { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
