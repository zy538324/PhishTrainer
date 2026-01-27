using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Handles tracking events:
/// - Open: 1x1 transparent PNG.
/// - Click: logs click, redirects to landing page.
/// - Submit: logs credential submissions.
/// - Report: logs user reports and updates risk score.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TrackingController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<TrackingController> _logger;

    public TrackingController(
        PhishDbContext db,
        ITenantResolver tenantResolver,
        ILogger<TrackingController> logger)
    {
        _db = db;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    // ---------- Open tracking (pixel) ----------

    [HttpGet("o/{token}.png")]
    public async Task<IActionResult> TrackOpen(string token)
    {
        try
        {
            var (tenantId, campaignId, targetId) = ParseToken(token);

            var currentSlug = _tenantResolver.GetTenantSlug()!;
            _tenantResolver.SetTenant(tenantId, currentSlug);

            var metadata = CaptureMetadata(HttpContext);

            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetId,
                EventType = CampaignEventType.Open.ToCode(),
                TimestampUtc = DateTime.UtcNow,
                MetadataJson = JsonSerializer.Serialize(metadata)
            });

            await _db.SaveChangesAsync();

            // Return 1x1 transparent PNG as per common practice.[web:140][web:143][web:145]
            return File(TransparentPixel, "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking open with token {Token}", token);
            return File(TransparentPixel, "image/png");
        }
    }

    // ---------- Click tracking ----------

    [HttpGet("t/{token}")]
    public async Task<IActionResult> TrackClick(string token)
    {
        try
        {
            var (tenantId, campaignId, targetId) = ParseToken(token);

            var currentSlug2 = _tenantResolver.GetTenantSlug()!;
            _tenantResolver.SetTenant(tenantId, currentSlug2);

            var metadata = CaptureMetadata(HttpContext);

            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetId,
                EventType = CampaignEventType.Click.ToCode(),
                TimestampUtc = DateTime.UtcNow,
                MetadataJson = JsonSerializer.Serialize(metadata)
            });

            await _db.SaveChangesAsync();

            var campaign = await _db.Campaigns
                .Include(c => c.LandingPage)
                .FirstOrDefaultAsync(c => c.Id == campaignId);

            if (campaign?.LandingPage == null)
            {
                _logger.LogWarning("Landing page not found for campaign {CampaignId}", campaignId);
                return Redirect("https://example.com"); // safe fallback
            }

            return Redirect(campaign.LandingPage.RedirectUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking click with token {Token}", token);
            return Redirect("https://example.com");
        }
    }

    // ---------- Credential submission ----------

    public class SubmissionDto
    {
        public string Token { get; set; } = string.Empty;
        public Dictionary<string, string> FormData { get; set; } = new();
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitCredentials([FromBody] SubmissionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest("Token is required.");

        try
        {
            var (tenantId, campaignId, targetId) = ParseToken(dto.Token);

            var currentSlug3 = _tenantResolver.GetTenantSlug()!;
            _tenantResolver.SetTenant(tenantId, currentSlug3);

            var targetUser = await _db.TargetUsers.FirstOrDefaultAsync(u => u.Id == targetId);
            if (targetUser == null) return NotFound("Target user not found.");

            // Only store counts / field names, not actual credentials, to stay privacy-friendly.[web:121][web:146]
            var metadata = new
            {
                fieldCount = dto.FormData.Count,
                fields = dto.FormData.Keys.ToList()
            };

            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetId,
                EventType = CampaignEventType.Submitted.ToCode(),
                TimestampUtc = DateTime.UtcNow,
                MetadataJson = JsonSerializer.Serialize(metadata)
            });

            AdjustRisk(targetUser, CampaignEventType.Submitted);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Submission recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording submission for token {Token}", dto.Token);
            return BadRequest();
        }
    }

    // ---------- User report (reported as phishing) ----------

    public class ReportDto
    {
        public string Token { get; set; } = string.Empty;
    }

    [HttpPost("report")]
    public async Task<IActionResult> ReportPhishing([FromBody] ReportDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest("Token is required.");

        try
        {
            var (tenantId, campaignId, targetId) = ParseToken(dto.Token);

            var currentSlug4 = _tenantResolver.GetTenantSlug()!;
            _tenantResolver.SetTenant(tenantId, currentSlug4);

            var targetUser = await _db.TargetUsers.FirstOrDefaultAsync(u => u.Id == targetId);
            if (targetUser == null) return NotFound("Target user not found.");

            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetId,
                EventType = CampaignEventType.Reported.ToCode(),
                TimestampUtc = DateTime.UtcNow
            });

            AdjustRisk(targetUser, CampaignEventType.Reported);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Report recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording report for token {Token}", dto.Token);
            return BadRequest();
        }
    }

    // ---------- Helpers ----------

    private (int tenantId, int campaignId, int targetId) ParseToken(string token)
    {
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = decoded.Split(':', StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length != 3 ||
                !int.TryParse(parts[0], out var tenantId) ||
                !int.TryParse(parts[1], out var campaignId) ||
                !int.TryParse(parts[2], out var targetId))
            {
                throw new InvalidOperationException("Invalid token format.");
            }

            return (tenantId, campaignId, targetId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse tracking token {Token}", token);
            throw;
        }
    }

    private object CaptureMetadata(HttpContext context)
    {
        return new
        {
            ip = context.Connection.RemoteIpAddress?.ToString(),
            userAgent = context.Request.Headers["User-Agent"].ToString(),
            timestampUtc = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Simple risk adjustment model:
    /// - Click: +0.5 weight
    /// - Submitted: +0.7 weight
    /// - Reported: -0.3 weight
    /// Based on common phishing risk scoring patterns.[web:129][web:134][web:148]
    /// </summary>
    private void AdjustRisk(TargetUser user, CampaignEventType eventType)
    {
        const double openWeight = 0.2;
        const double clickWeight = 0.5;
        const double submittedWeight = 0.7;
        const double reportedWeight = -0.3;

        double delta = 0;

        switch (eventType)
        {
            case CampaignEventType.Open:
                delta = openWeight;
                break;
            case CampaignEventType.Click:
                delta = clickWeight;
                user.IncidentCount++;
                user.LastIncidentAt = DateTime.UtcNow;
                break;
            case CampaignEventType.Submitted:
                delta = submittedWeight;
                user.IncidentCount++;
                user.LastIncidentAt = DateTime.UtcNow;
                break;
            case CampaignEventType.Reported:
                delta = reportedWeight;
                break;
        }

        user.RiskScore = Math.Clamp(user.RiskScore + delta * 10, 0, 100);
    }

    // 1x1 transparent PNG byte array
    private static readonly byte[] TransparentPixel =
    {
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
    };
}
