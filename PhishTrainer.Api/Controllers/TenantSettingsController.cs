using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;
using PhishTrainer.Api.Security;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/tenant/settings")]
[Route("api/settings")]
[RequireRole(Roles.MspAdmin, Roles.TenantAdmin)]
public class TenantSettingsController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public TenantSettingsController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    // Backward-compatible GET (no secrets)
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        return Ok(new
        {
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            tenant.IsActive,
            tenant.LogoUrl,
            tenant.PrimaryColorHex,
            tenant.SmtpDisplayName,
            tenant.SmtpFromAddress,
            tenant.SmtpHost,
            tenant.SmtpPort,
            tenant.UseAzureAdSmtp,
            tenant.AzureAdTenantId,
            tenant.AzureAdClientId,
            tenant.AzureAdDomain,
            hasAzureAdClientSecret = !string.IsNullOrWhiteSpace(tenant.AzureAdClientSecret)
        });
    }

    public class TenantSettingsDto
    {
        public string? Name { get; set; }
        public string? LogoUrl { get; set; }
        public string? PrimaryColorHex { get; set; }

        public string? SmtpDisplayName { get; set; }
        public string? SmtpFromAddress { get; set; }
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public bool? UseAzureAdSmtp { get; set; }

        public string? AzureAdTenantId { get; set; }
        public string? AzureAdClientId { get; set; }
        public string? AzureAdClientSecret { get; set; }
        public string? AzureAdDomain { get; set; }
        public bool? ClearAzureAdClientSecret { get; set; }
    }

    // Backward-compatible PUT (supports clearing secret)
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] TenantSettingsDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        if (dto.Name != null) tenant.Name = dto.Name;
        if (dto.LogoUrl != null) tenant.LogoUrl = dto.LogoUrl;
        if (dto.PrimaryColorHex != null) tenant.PrimaryColorHex = dto.PrimaryColorHex;

        if (dto.SmtpDisplayName != null) tenant.SmtpDisplayName = dto.SmtpDisplayName;
        if (dto.SmtpFromAddress != null) tenant.SmtpFromAddress = dto.SmtpFromAddress;
        if (dto.SmtpHost != null) tenant.SmtpHost = dto.SmtpHost;
        if (dto.SmtpPort.HasValue) tenant.SmtpPort = dto.SmtpPort;
        if (dto.UseAzureAdSmtp.HasValue) tenant.UseAzureAdSmtp = dto.UseAzureAdSmtp.Value;

        if (dto.AzureAdTenantId != null) tenant.AzureAdTenantId = dto.AzureAdTenantId;
        if (dto.AzureAdClientId != null) tenant.AzureAdClientId = dto.AzureAdClientId;
        if (!string.IsNullOrWhiteSpace(dto.AzureAdClientSecret)) tenant.AzureAdClientSecret = dto.AzureAdClientSecret;
        if (dto.AzureAdDomain != null) tenant.AzureAdDomain = dto.AzureAdDomain;
        if (dto.ClearAzureAdClientSecret == true) tenant.AzureAdClientSecret = null;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // --------- Branding ---------
    [HttpGet("branding")]
    public async Task<IActionResult> GetBranding()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        return Ok(new
        {
            tenant.Name,
            tenant.LogoUrl,
            tenant.PrimaryColorHex
        });
    }

    public class BrandingDto
    {
        public string? Name { get; set; }
        public string? LogoUrl { get; set; }
        public string? PrimaryColorHex { get; set; }
    }

    [HttpPut("branding")]
    public async Task<IActionResult> UpdateBranding([FromBody] BrandingDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        if (dto.Name != null) tenant.Name = dto.Name;
        if (dto.LogoUrl != null) tenant.LogoUrl = dto.LogoUrl;
        if (dto.PrimaryColorHex != null) tenant.PrimaryColorHex = dto.PrimaryColorHex;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // --------- SMTP ---------
    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtp()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        return Ok(new
        {
            tenant.SmtpDisplayName,
            tenant.SmtpFromAddress,
            tenant.SmtpHost,
            tenant.SmtpPort,
            tenant.UseAzureAdSmtp
        });
    }

    public class SmtpSettingsDto
    {
        public string? SmtpDisplayName { get; set; }
        public string? SmtpFromAddress { get; set; }
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public bool? UseAzureAdSmtp { get; set; }
    }

    [HttpPut("smtp")]
    public async Task<IActionResult> UpdateSmtp([FromBody] SmtpSettingsDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        if (dto.SmtpDisplayName != null) tenant.SmtpDisplayName = dto.SmtpDisplayName;
        if (dto.SmtpFromAddress != null) tenant.SmtpFromAddress = dto.SmtpFromAddress;
        if (dto.SmtpHost != null) tenant.SmtpHost = dto.SmtpHost;
        if (dto.SmtpPort.HasValue) tenant.SmtpPort = dto.SmtpPort;
        if (dto.UseAzureAdSmtp.HasValue) tenant.UseAzureAdSmtp = dto.UseAzureAdSmtp.Value;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // --------- Azure AD / OAuth ---------
    [HttpGet("azure")]
    public async Task<IActionResult> GetAzure()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        return Ok(new
        {
            tenant.AzureAdTenantId,
            tenant.AzureAdClientId,
            tenant.AzureAdDomain,
            hasAzureAdClientSecret = !string.IsNullOrWhiteSpace(tenant.AzureAdClientSecret)
        });
    }

    public class AzureSettingsDto
    {
        public string? AzureAdTenantId { get; set; }
        public string? AzureAdClientId { get; set; }
        public string? AzureAdClientSecret { get; set; }
        public string? AzureAdDomain { get; set; }
        public bool? ClearAzureAdClientSecret { get; set; }
    }

    [HttpPut("azure")]
    public async Task<IActionResult> UpdateAzure([FromBody] AzureSettingsDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound();

        if (dto.AzureAdTenantId != null) tenant.AzureAdTenantId = dto.AzureAdTenantId;
        if (dto.AzureAdClientId != null) tenant.AzureAdClientId = dto.AzureAdClientId;
        if (!string.IsNullOrWhiteSpace(dto.AzureAdClientSecret)) tenant.AzureAdClientSecret = dto.AzureAdClientSecret;
        if (dto.AzureAdDomain != null) tenant.AzureAdDomain = dto.AzureAdDomain;
        if (dto.ClearAzureAdClientSecret == true) tenant.AzureAdClientSecret = null;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
