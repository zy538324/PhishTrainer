using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services;

public class EmailQueueService : IEmailQueueService
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public EmailQueueService(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    public async Task EnqueueAsync(
        int campaignId,
        int targetUserId,
        string toAddress,
        string subject,
        string htmlBody,
        string trackingToken,
        DateTime scheduledAtUtc,
        CancellationToken ct = default)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenantSlug = _tenantResolver.GetTenantSlug() ?? "default";

        var item = new EmailQueueItem
        {
            TenantId = tenantId,
            TenantSlug = tenantSlug,
            CampaignId = campaignId,
            TargetUserId = targetUserId,
            ToAddress = toAddress,
            Subject = subject,
            HtmlBody = htmlBody,
            TrackingToken = trackingToken,
            ScheduledAtUtc = scheduledAtUtc,
            Status = EmailQueueStatus.Pending
        };

        _db.EmailQueue.Add(item);
        await _db.SaveChangesAsync(ct);
    }
}
