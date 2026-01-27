using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Services.BackgroundJobs;

/// <summary>
/// Background job wrapper for launching scheduled campaigns.
/// You can wire this into Hangfire, Quartz, or a simple HostedService.
/// </summary>
public class CampaignLaunchJobs
{
    private readonly ICampaignService _campaignService;
    private readonly ILogger<CampaignLaunchJobs> _logger;

    public CampaignLaunchJobs(
        ICampaignService campaignService,
        ILogger<CampaignLaunchJobs> logger)
    {
        _campaignService = campaignService;
        _logger = logger;
    }

    /// <summary>
    /// Launches a single campaign immediately.
    /// Intended to be called by a background scheduler.
    /// </summary>
    public async Task LaunchCampaignAsync(int campaignId, CancellationToken ct = default)
    {
        try
        {
            await _campaignService.LaunchCampaignAsync(campaignId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background job failed to launch campaign {CampaignId}", campaignId);
            throw;
        }
    }

    /// <summary>
    /// Scans for due scheduled campaigns and launches them.
    /// Call this periodically from a scheduler (e.g. every minute).
    /// </summary>
    public async Task LaunchDueCampaignsAsync(CancellationToken ct = default)
    {
        try
        {
            await _campaignService.LaunchDueCampaignsAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background job failed while launching due campaigns");
            throw;
        }
    }
}
