namespace PhishTrainer.Api.DTOs;

/// <summary>
/// Aggregated metrics for a phishing campaign.
/// Mirrors common KPIs in phishing simulation tools.[web:171][web:165][web:169]
/// </summary>
public class CampaignSummaryDto
{
    public int CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;

    public int TotalSent { get; set; }
    public int TotalOpen { get; set; }
    public int TotalClick { get; set; }
    public int TotalSubmitted { get; set; }
    public int TotalReported { get; set; }

    /// <summary>Open rate (%) = opens / sent.</summary>
    public double OpenRate { get; set; }

    /// <summary>Click rate (%) = clicks / sent.</summary>
    public double ClickRate { get; set; }

    /// <summary>Submission rate (%) = submissions / sent.</summary>
    public double SubmittedRate { get; set; }

    /// <summary>Report rate (%) = reports / sent.</summary>
    public double ReportedRate { get; set; }
}
