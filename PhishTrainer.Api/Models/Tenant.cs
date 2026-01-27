using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// A customer / organisation using the platform.
/// Holds branding and integration settings like SMTP and Azure AD.[web:321][web:325][web:326][web:330]
/// </summary>
public class Tenant
{
    public int Id { get; set; }

    /// <summary>
    /// URL-safe slug used in subdomains or headers (e.g. "acme").[web:332][web:324]
    /// </summary>
    [MaxLength(64)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(256)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Whether this tenant is active and allowed to run campaigns.</summary>
    public bool IsActive { get; set; } = true;

    // Branding
    [MaxLength(256)]
    public string? LogoUrl { get; set; }

    [MaxLength(256)]
    public string? PrimaryColorHex { get; set; }

    // SMTP / sending configuration (per tenant)

    /// <summary>
    /// Display name used in From headers when sending emails.[web:326][web:333]
    /// </summary>
    [MaxLength(128)]
    public string? SmtpDisplayName { get; set; }

    /// <summary>
    /// From address used for phishing simulations.[web:325][web:326]
    /// </summary>
    [MaxLength(256)]
    public string? SmtpFromAddress { get; set; }

    /// <summary>
    /// Optional custom SMTP host if not using Microsoft 365.[web:325]
    /// </summary>
    [MaxLength(256)]
    public string? SmtpHost { get; set; }

    /// <summary>
    /// SMTP port (587 for STARTTLS, 25, etc.).[web:325]
    /// </summary>
    public int? SmtpPort { get; set; }

    /// <summary>
    /// If true, use OAuth2 (client credentials) with Microsoft 365 SMTP,
    /// otherwise fall back to basic SMTP config above.[web:325][web:328]
    /// </summary>
    public bool UseAzureAdSmtp { get; set; } = true;

    // Azure AD / OAuth app for SMTP and directory integrations

    [MaxLength(64)]
    public string? AzureAdTenantId { get; set; }

    [MaxLength(64)]
    public string? AzureAdClientId { get; set; }

    [MaxLength(256)]
    public string? AzureAdClientSecret { get; set; }

    /// <summary>
    /// Optional Azure AD domain or display name for UX.[web:330]
    /// </summary>
    [MaxLength(256)]
    public string? AzureAdDomain { get; set; }

    // Navigation
    public List<User> Users { get; set; } = new();
}
