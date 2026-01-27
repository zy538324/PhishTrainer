using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services;

/// <summary>
/// Orchestrates campaign execution:
/// validates state, loads targets, sends emails, and updates status.
/// Also supports launching all due scheduled campaigns.[web:8][web:214][web:225]
/// </summary>
public class CampaignService : ICampaignService
{
    private readonly PhishDbContext _db;
    private readonly IMailService _mailService;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<CampaignService> _logger;

    public CampaignService(
        PhishDbContext db,
        IMailService mailService,
        ITenantResolver tenantResolver,
        ILogger<CampaignService> logger)
    {
        _db = db;
        _mailService = mailService;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task LaunchCampaignAsync(int campaignId, CancellationToken ct = default)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var campaign = await _db.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.TargetGroup)
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.TenantId == tenantId, ct);

        if (campaign == null)
            throw new InvalidOperationException($"Campaign {campaignId} not found for tenant {tenantId}.");

        if (campaign.Status is not ("Draft" or "Scheduled"))
            throw new InvalidOperationException("Campaign must be in Draft or Scheduled state to launch.");

        // Load targets
        var targets = await _db.TargetUsers
            .Where(t => t.TargetGroupId == campaign.TargetGroupId && t.IsActive)
            .AsNoTracking()
            .ToListAsync(ct);

        if (targets.Count == 0)
        {
            _logger.LogWarning("Campaign {CampaignId} has no active targets.", campaignId);
            campaign.Status = "Completed";
            await _db.SaveChangesAsync(ct);
            return;
        }

        campaign.Status = "Running";
        campaign.LaunchedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var delayBetweenEmailsMs = CalculateDelayBetweenEmails(campaign.ThrottlePerMinute);

        int successCount = 0;
        int failureCount = 0;

        foreach (var target in targets)
        {
            if (ct.IsCancellationRequested)
            {
                _logger.LogInformation("Campaign {CampaignId} launch cancelled.", campaignId);
                campaign.Status = "Paused";
                await _db.SaveChangesAsync(ct);
                return;
            }

            try
            {
                var token = BuildTrackingToken(tenantId, campaignId, target.Id);

                await _mailService.SendPhishingMailAsync(
                    campaignId,
                    target.Id,
                    target.Email,
                    campaign.EmailTemplate.Subject,
                    campaign.EmailTemplate.HtmlBody,
                    token,
                    ct);

                successCount++;
            }
            catch (Exception ex)
            {
                failureCount++;
                _logger.LogError(ex,
                    "Failed to send to {Email} for campaign {CampaignId}",
                    target.Email,
                    campaignId);
            }

            if (delayBetweenEmailsMs > 0)
            {
                await Task.Delay(delayBetweenEmailsMs, ct);
            }
        }

        campaign.Status = "Completed";
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Campaign {CampaignId} completed: {SuccessCount} sent, {FailureCount} failed, Targets={TotalTargets}",
            campaignId,
            successCount,
            failureCount,
            targets.Count);
    }

    /// <summary>
    /// Find all campaigns that are scheduled, due, and not yet launched,
    /// and launch each one (sequentially) for the current tenant.[web:366][web:374]
    /// </summary>
    public async Task LaunchDueCampaignsAsync(CancellationToken ct = default)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var now = DateTime.UtcNow;

        var dueCampaigns = await _db.Campaigns
            .Where(c =>
                c.TenantId == tenantId &&
                c.Status == "Scheduled" &&
                c.ScheduledAtUtc <= now)
            .OrderBy(c => c.ScheduledAtUtc)
            .ToListAsync(ct);

        foreach (var campaign in dueCampaigns)
        {
            if (ct.IsCancellationRequested)
                break;

            try
            {
                await LaunchCampaignAsync(campaign.Id, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error launching scheduled campaign {CampaignId}", campaign.Id);
            }
        }
    }

    private static int CalculateDelayBetweenEmails(int throttlePerMinute)
    {
        if (throttlePerMinute <= 0)
            return 0;

        // Example: 60 emails/min -> 1000 ms, 120 emails/min -> 500 ms.[web:219]
        return (int)(60_000.0 / throttlePerMinute);
    }

    /// <summary>
    /// Builds a tracking token containing tenant, campaign, and user identifiers.
    /// Currently base64-encoded "tenant:campaign:user"; could be upgraded to JWT later.[web:273]
    /// </summary>
    private static string BuildTrackingToken(int tenantId, int campaignId, int targetId)
    {
        var payload = $"{tenantId}:{campaignId}:{targetId}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload));
    }
}
