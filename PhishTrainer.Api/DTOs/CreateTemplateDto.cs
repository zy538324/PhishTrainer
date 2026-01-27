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
    /// Must contain {{TrackingPixel}} and {{ClickLink}} (validated in TemplatesController).[web:241][web:242][web:245]
    /// </summary>
    [Required]
    public string HtmlBody { get; set; } = string.Empty;

    /// <summary>
    /// Optional logical category (HR, IT, Delivery, Finance, Brand, etc.).[web:193][web:239][web:244]
    /// </summary>
    [MaxLength(64)]
    public string? Category { get; set; }

    /// <summary>
    /// Difficulty label such as VeryEasy, Easy, Medium, Hard, VeryHard.[web:194][web:201][web:212][web:243]
    /// </summary>
    [MaxLength(32)]
    public string? Difficulty { get; set; }

    /// <summary>
    /// Optional comma-separated tags (e.g. "hr,internal,spoofed-brand").[web:193][web:240]
    /// </summary>
    [MaxLength(256)]
    public string? TagsCsv { get; set; }
}
