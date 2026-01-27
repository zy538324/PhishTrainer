using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// Phishing email template for a tenant:
/// HTML content plus category, difficulty and tags used for targeting and reporting.[web:193][web:238][web:194][web:201]
/// </summary>
public class EmailTemplate : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    // Core fields
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(256)]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Full HTML body.
    /// Your system expects {{TrackingPixel}} and {{ClickLink}} placeholders to be present.[web:241][web:245]
    /// </summary>
    public string HtmlBody { get; set; } = string.Empty;

    /// <summary>
    /// Optional category (HR, IT, Delivery, Finance, Social, Brand etc.).[web:193][web:238][web:244]
    /// </summary>
    [MaxLength(64)]
    public string? Category { get; set; }

    /// <summary>
    /// Difficulty rating such as VeryEasy, Easy, Medium, Hard, VeryHard
    /// to approximate detection difficulty.[web:194][web:201][web:198][web:243]
    /// </summary>
    [MaxLength(32)]
    public string? Difficulty { get; set; }

    /// <summary>
    /// Optional comma-separated tags (e.g. "hr,internal,spoofed-brand").[web:193][web:240]
    /// </summary>
    public string? TagsCsv { get; set; }

    /// <summary>
    /// Optional provenance or source for imported templates (e.g. "system", "custom", or external feed).[web:193][web:277]
    /// </summary>
    [MaxLength(128)]
    public string? ImportedFrom { get; set; }

    // Audit
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
