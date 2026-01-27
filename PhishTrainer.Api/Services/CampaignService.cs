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
    private readonly IEmailQueueService _emailQueue;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<CampaignService> _logger;

    public CampaignService(
        PhishDbContext db,
        IEmailQueueService emailQueue,
        ITenantResolver tenantResolver,
        ILogger<CampaignService> logger)
    {
        _db = db;
        _emailQueue = emailQueue;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task LaunchCampaignAsync(int campaignId, CancellationToken ct = default)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant == null)
            throw new InvalidOperationException("Tenant not found.");

        var campaign = await _db.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.EmailTemplateB)
            .Include(c => c.TargetGroup)
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.TenantId == tenantId, ct);

        if (campaign == null)
            throw new InvalidOperationException($"Campaign {campaignId} not found for tenant {tenantId}.");

        if (campaign.Status is not ("Draft" or "Scheduled"))
            throw new InvalidOperationException("Campaign must be in Draft or Scheduled state to launch.");

        ValidateTenantMailConfig(tenant);

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

        campaign.Status = "Queued";
        campaign.LaunchedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var delayBetweenEmailsMs = CalculateDelayBetweenEmails(campaign.ThrottlePerMinute);

        int queuedCount = 0;
        int failureCount = 0;

        var scheduledAt = DateTime.UtcNow;
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
                var template = PickTemplateForTarget(campaign, target.Id);

                await _emailQueue.EnqueueAsync(
                    campaignId,
                    target.Id,
                    target.Email,
                    template.Subject,
                    template.HtmlBody,
                    token,
                    scheduledAt,
                    ct);

                queuedCount++;
            }
            catch (Exception ex)
            {
                failureCount++;
                _logger.LogError(ex,
                    "Failed to queue email to {Email} for campaign {CampaignId}",
                    target.Email,
                    campaignId);
            }

            if (delayBetweenEmailsMs > 0)
            {
                scheduledAt = scheduledAt.AddMilliseconds(delayBetweenEmailsMs);
            }
        }

        await _db.SaveChangesAsync(ct);

        // Reschedule if recurring, otherwise complete when queue drains
        if (IsRecurring(campaign))
        {
            var next = GetNextOccurrenceUtc(campaign.ScheduledAtUtc ?? DateTime.UtcNow, campaign.RecurrenceType, campaign.RecurrenceInterval);
            if (campaign.RecurrenceEndUtc.HasValue && next > campaign.RecurrenceEndUtc.Value)
            {
                campaign.Status = "Completed";
            }
            else
            {
                campaign.ScheduledAtUtc = next;
                campaign.Status = "Scheduled";
            }
            await _db.SaveChangesAsync(ct);
        }

        _logger.LogInformation(
            "Campaign {CampaignId} queued: {QueuedCount} queued, {FailureCount} failed, Targets={TotalTargets}",
            campaignId,
            queuedCount,
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

    private static bool IsRecurring(Campaign campaign)
        => !string.Equals(campaign.RecurrenceType, "None", StringComparison.OrdinalIgnoreCase);

    private static DateTime GetNextOccurrenceUtc(DateTime current, string recurrenceType, int interval)
    {
        interval = Math.Max(1, interval);
        return recurrenceType switch
        {
            "Daily" => current.AddDays(interval),
            "Weekly" => current.AddDays(7 * interval),
            "Monthly" => current.AddMonths(interval),
            _ => current
        };
    }

    private static EmailTemplate PickTemplateForTarget(Campaign campaign, int targetUserId)
    {
        if (campaign.EmailTemplateB == null || campaign.AbSplitPercent <= 0)
        {
            return campaign.EmailTemplate;
        }

        if (campaign.AbSplitPercent >= 100)
        {
            return campaign.EmailTemplateB;
        }

        var bucket = Math.Abs(HashCode.Combine(targetUserId, campaign.Id)) % 100;
        return bucket < campaign.AbSplitPercent
            ? campaign.EmailTemplateB
            : campaign.EmailTemplate;
    }

    private static void ValidateTenantMailConfig(Tenant tenant)
    {
        if (string.IsNullOrWhiteSpace(tenant.SmtpFromAddress))
        {
            throw new InvalidOperationException("SMTP From address is required. Update tenant email settings.");
        }

        if (tenant.UseAzureAdSmtp)
        {
            if (string.IsNullOrWhiteSpace(tenant.AzureAdTenantId) ||
                string.IsNullOrWhiteSpace(tenant.AzureAdClientId) ||
                string.IsNullOrWhiteSpace(tenant.AzureAdClientSecret))
            {
                throw new InvalidOperationException("Azure AD SMTP is enabled but credentials are missing. Configure Azure AD settings or disable Azure SMTP.");
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(tenant.SmtpHost) || !tenant.SmtpPort.HasValue)
            {
                throw new InvalidOperationException("SMTP Host and Port are required when Azure AD is disabled.");
            }
        }
    }
}
