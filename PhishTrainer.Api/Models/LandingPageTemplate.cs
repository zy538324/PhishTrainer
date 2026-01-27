using System.ComponentModel.DataAnnotations;

namespace PhishTrainer.Api.Models;

/// <summary>
/// Landing page template shown after a user clicks a phishing link:
/// can optionally capture credentials and then redirect to a real site.[web:289][web:288][web:296][web:301]
/// </summary>
public class LandingPageTemplate : IMustHaveTenant
{
    public int Id { get; set; }

    // Multi-tenancy
    public int TenantId { get; set; }

    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Full HTML body of the landing page (fake login, info page, etc.).[web:289][web:297][web:298]
    /// </summary>
    public string HtmlBody { get; set; } = string.Empty;

    /// <summary>
    /// URL the user is redirected to after submit or after viewing,
    /// typically the real site being spoofed.[web:288][web:289][web:292]
    /// </summary>
    [MaxLength(512)]
    public string RedirectUrl { get; set; } = string.Empty;

    /// <summary>
    /// If true, treat form submissions on this page as credential capture events
    /// (you still only log metadata, not real credentials).[web:289][web:296][web:299]
    /// </summary>
    public bool CollectCredentials { get; set; } = false;

    /// <summary>
    /// If true, mask or avoid storing actual credential values, only counts/field names.[web:295][web:297]
    /// </summary>
    public bool MaskCredentials { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
