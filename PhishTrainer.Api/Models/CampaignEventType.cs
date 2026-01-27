namespace PhishTrainer.Api.Models;

public enum CampaignEventType
{
    Sent,
    Open,
    Click,
    Submitted,
    Reported,
    Bounced
}

public static class CampaignEventTypeExtensions
{
    public static string ToCode(this CampaignEventType t) => t.ToString();
}
