using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// Individual user that can be targeted in phishing campaigns,
/// including attributes for personalisation and a rolling risk score.[web:303][web:315][web:129][web:148]
/// </summary>
public class TargetUser : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    // Grouping
    public int? TargetGroupId { get; set; }

    // Identity
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(256)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(128)]
    public string? Department { get; set; }

    [MaxLength(256)]
    public string? ManagerEmail { get; set; }

    [MaxLength(128)]
    public string? Location { get; set; }

    /// <summary>
    /// Whether this user is currently eligible to receive simulations.[web:8]
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Risk and behaviour

    /// <summary>
    /// Normalised risk score 0–100, higher means more likely to fall for phishing.[web:129][web:148][web:310]
    /// </summary>
    public double RiskScore { get; set; } = 0;

    /// <summary>
    /// Count of negative phishing interactions (clicks, submissions, etc.).[web:148][web:310]
    /// </summary>
    public int IncidentCount { get; set; } = 0;

    /// <summary>
    /// Timestamp of the last negative interaction, if any.[web:148][web:129]
    /// </summary>
    public DateTime? LastIncidentAt { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public TargetGroup? Group { get; set; }
}
