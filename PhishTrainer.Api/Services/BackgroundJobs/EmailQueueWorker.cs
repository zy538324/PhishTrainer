using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services.BackgroundJobs;

/// <summary>
/// Background worker that processes queued emails and retries failures.
/// </summary>
public class EmailQueueWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailQueueWorker> _logger;

    public EmailQueueWorker(IServiceScopeFactory scopeFactory, ILogger<EmailQueueWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailQueueWorker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "EmailQueueWorker batch failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PhishDbContext>();

        var now = DateTime.UtcNow;

        // Query across all tenants without requiring tenant resolution
        var batch = await db.EmailQueue
            .IgnoreQueryFilters()
            .Where(q => (q.Status == EmailQueueStatus.Pending || q.Status == EmailQueueStatus.Retrying) && q.ScheduledAtUtc <= now)
            .OrderBy(q => q.ScheduledAtUtc)
            .Take(25)
            .AsNoTracking()
            .ToListAsync(ct);

        if (batch.Count == 0) return;

        // Process per-tenant to avoid re-setting tenant in the same scope
        foreach (var group in batch.GroupBy(b => new { b.TenantId, b.TenantSlug }))
        {
            if (ct.IsCancellationRequested) break;

            using var tenantScope = _scopeFactory.CreateScope();
            var tenantDb = tenantScope.ServiceProvider.GetRequiredService<PhishDbContext>();
            var mailService = tenantScope.ServiceProvider.GetRequiredService<IMailService>();
            var tenantResolver = tenantScope.ServiceProvider.GetRequiredService<ITenantResolver>();

            var tenantSlug = string.IsNullOrWhiteSpace(group.Key.TenantSlug) ? "default" : group.Key.TenantSlug;
            tenantResolver.SetTenant(group.Key.TenantId, tenantSlug);

            foreach (var itemRef in group)
            {
                if (ct.IsCancellationRequested) break;

                var item = await tenantDb.EmailQueue.FirstOrDefaultAsync(q => q.Id == itemRef.Id, ct);
                if (item == null) continue;

                item.Status = EmailQueueStatus.Processing;
                item.LastAttemptAtUtc = now;
                item.Attempts += 1;
                await tenantDb.SaveChangesAsync(ct);

                try
                {
                    await mailService.SendPhishingMailAsync(
                        item.CampaignId,
                        item.TargetUserId,
                        item.ToAddress,
                        item.Subject,
                        item.HtmlBody,
                        item.TrackingToken,
                        ct);

                    item.Status = EmailQueueStatus.Sent;
                    item.SentAtUtc = DateTime.UtcNow;
                    item.LastError = null;
                    await tenantDb.SaveChangesAsync(ct);

                    await TryCompleteCampaignAsync(tenantDb, item.CampaignId, item.TenantId, ct);
                }
                catch (Exception ex)
                {
                    var delay = GetRetryDelay(item.Attempts);
                    item.LastError = ex.Message;

                    if (item.Attempts >= item.MaxAttempts)
                    {
                        item.Status = EmailQueueStatus.Failed;
                        await tenantDb.SaveChangesAsync(ct);
                    }
                    else
                    {
                        item.Status = EmailQueueStatus.Retrying;
                        item.ScheduledAtUtc = DateTime.UtcNow.Add(delay);
                        await tenantDb.SaveChangesAsync(ct);
                    }

                    _logger.LogWarning(ex, "Email send failed for queue item {QueueId} (attempt {Attempt})", item.Id, item.Attempts);
                }
            }
        }
    }

    private static TimeSpan GetRetryDelay(int attempt)
    {
        // Exponential-ish backoff: 1m, 5m, 15m, 1h, 6h
        return attempt switch
        {
            1 => TimeSpan.FromMinutes(1),
            2 => TimeSpan.FromMinutes(5),
            3 => TimeSpan.FromMinutes(15),
            4 => TimeSpan.FromHours(1),
            _ => TimeSpan.FromHours(6)
        };
    }

    private static async Task TryCompleteCampaignAsync(PhishDbContext db, int campaignId, int tenantId, CancellationToken ct)
    {
        var remaining = await db.EmailQueue
            .Where(q => q.TenantId == tenantId && q.CampaignId == campaignId &&
                        (q.Status == EmailQueueStatus.Pending || q.Status == EmailQueueStatus.Retrying || q.Status == EmailQueueStatus.Processing))
            .AnyAsync(ct);

        if (!remaining)
        {
            var campaign = await db.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId && c.TenantId == tenantId, ct);
            if (campaign != null && campaign.Status is "Running" or "Queued")
            {
                campaign.Status = "Completed";
                await db.SaveChangesAsync(ct);
            }
        }
    }
}
