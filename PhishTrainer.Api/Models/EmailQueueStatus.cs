namespace PhishTrainer.Api.Models;

public enum EmailQueueStatus
{
    Pending,
    Processing,
    Retrying,
    Sent,
    Failed
}
