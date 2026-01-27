namespace PhishTrainer.Api.DTOs;

public class CampaignSummaryDto
{
    public int CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;

    public int TotalSent { get; set; }
    public int TotalOpen { get; set; }
    public int TotalClick { get; set; }
    public int TotalSubmitted { get; set; }
    public int TotalReported { get; set; }

    public double OpenRate { get; set; }
    public double ClickRate { get; set; }
    public double SubmittedRate { get; set; }
    public double ReportedRate { get; set; }
}
