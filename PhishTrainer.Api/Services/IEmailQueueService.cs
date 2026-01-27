namespace PhishTrainer.Api.Services;

public interface IEmailQueueService
{
    Task EnqueueAsync(
        int campaignId,
        int targetUserId,
        string toAddress,
        string subject,
        string htmlBody,
        string trackingToken,
        DateTime scheduledAtUtc,
        CancellationToken ct = default);
}
