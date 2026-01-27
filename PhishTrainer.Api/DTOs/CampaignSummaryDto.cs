using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.DTOs;

/// <summary>
/// Payload to create or update a phishing email template.
/// Includes metadata for category, difficulty, and tags.[web:193][web:194][web:201]
/// </summary>
public class CreateTemplateDto
{
    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// HTML content of the email.
    /// Must contain {{TrackingPixel}} and {{ClickLink}} (validated in TemplatesController).[web:205][web:141]
    /// </summary>
    [Required]
    public string HtmlBody { get; set; } = string.Empty;

    /// <summary>
    /// Optional logical category (HR, IT, Delivery, Finance, etc.).[web:193][web:197]
    /// </summary>
    [MaxLength(64)]
    public string? Category { get; set; }

    /// <summary>
    /// Difficulty label such as VeryEasy, Easy, Medium, Hard, VeryHard.[web:194][web:201][web:212]
    /// </summary>
    [MaxLength(32)]
    public string? Difficulty { get; set; }

    /// <summary>
    /// Optional comma-separated tags (e.g. "hr,internal,spoofed-brand").[web:193]
    /// </summary>
    [MaxLength(256)]
    public string? TagsCsv { get; set; }
}
