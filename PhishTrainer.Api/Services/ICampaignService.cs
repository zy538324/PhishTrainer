using PhishTrainer.Api.Data;

namespace PhishTrainer.Api.Services;

/// <summary>
/// Orchestrates phishing campaign execution:
/// launching immediately and processing scheduled/due campaigns.[web:366][web:374]
/// </summary>
public interface ICampaignService
{
    /// <summary>
    /// Launch a single campaign immediately for the current tenant.
    /// Validates status and sends to all active targets in the group.
    /// </summary>
    Task LaunchCampaignAsync(int campaignId, CancellationToken ct = default);

    /// <summary>
    /// Scan for campaigns whose ScheduledAtUtc is in the past,
    /// still in Scheduled state, and launch them.
    /// Intended to be called by a background scheduler/job.[web:366][web:374]
    /// </summary>
    Task LaunchDueCampaignsAsync(CancellationToken ct = default);
}
