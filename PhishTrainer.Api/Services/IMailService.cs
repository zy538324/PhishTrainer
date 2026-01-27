using System.Threading;
using System.Threading.Tasks;

namespace PhishTrainer.Api.Services;

public interface IMailService
{
    Task SendPhishingMailAsync(
        int campaignId,
        int targetUserId,
        string toAddress,
        string subject,
        string htmlBody,
        string trackingToken,
        CancellationToken ct = default);
}
