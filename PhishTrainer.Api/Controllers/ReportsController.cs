using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.DTOs;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Read-only reporting endpoints for phishing simulations:
/// - Campaign-level metrics
/// - User-level metrics within a campaign
/// - High-risk users across the tenant
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public ReportsController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    /// <summary>
    /// Returns all campaigns with basic KPI metrics (sent, open, click, submit, report rates).
    /// Good for an overview dashboard.[web:171][web:169]
    /// </summary>
    [HttpGet("campaigns")]
    public async Task<ActionResult<IEnumerable<CampaignSummaryDto>>> GetCampaignSummaries()
    {
        var tenantId = _tenantResolver.GetTenantId();

        // Pre-load campaigns for tenant
        var campaigns = await _db.Campaigns
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        var campaignIds = campaigns.Select(c => c.Id).ToList();

        var events = await _db.CampaignEvents
            .Where(e => campaignIds.Contains(e.CampaignId))
            .ToListAsync();

        var summaries = campaigns.Select(c =>
        {
            var e = events.Where(x => x.CampaignId == c.Id).ToList();

            int totalSent = e.Count(x => x.EventType == CampaignEventType.Sent.ToCode());
            int totalOpen = e.Count(x => x.EventType == CampaignEventType.Open.ToCode());
            int totalClick = e.Count(x => x.EventType == CampaignEventType.Click.ToCode());
            int totalSubmitted = e.Count(x => x.EventType == CampaignEventType.Submitted.ToCode());
            int totalReported = e.Count(x => x.EventType == CampaignEventType.Reported.ToCode());

            double Rate(int count) => totalSent > 0 ? count * 100.0 / totalSent : 0;

            return new CampaignSummaryDto
            {
                CampaignId = c.Id,
                Name = c.Name,
                TotalSent = totalSent,
                TotalOpen = totalOpen,
                TotalClick = totalClick,
                TotalSubmitted = totalSubmitted,
                TotalReported = totalReported,
                OpenRate = Rate(totalOpen),
                ClickRate = Rate(totalClick),
                SubmittedRate = Rate(totalSubmitted),
                ReportedRate = Rate(totalReported)
            };
        }).ToList();

        return Ok(summaries);
    }

    /// <summary>
    /// CSV export of campaign summaries (for tenant).
    /// </summary>
    [HttpGet("campaigns/export")]
    public async Task<IActionResult> ExportCampaignSummariesCsv()
    {
        var summaries = await GetCampaignSummaries();
        if (summaries.Result is ObjectResult obj && obj.Value is IEnumerable<CampaignSummaryDto> list)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("CampaignId,Name,TotalSent,TotalOpen,TotalClick,TotalSubmitted,TotalReported,OpenRate,ClickRate,SubmittedRate,ReportedRate");
            foreach (var s in list)
            {
                csv.AppendLine($"{s.CampaignId},\"{s.Name}\",{s.TotalSent},{s.TotalOpen},{s.TotalClick},{s.TotalSubmitted},{s.TotalReported},{s.OpenRate:F2},{s.ClickRate:F2},{s.SubmittedRate:F2},{s.ReportedRate:F2}");
            }
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "campaign_summaries.csv");
        }

        return BadRequest(new { error = "Unable to export" });
    }

    /// <summary>
    /// Returns per-user behaviour for a campaign
    /// (sent/open/click/submitted/reported flags + risk score).[web:165][web:171][web:169]
    /// </summary>
    [HttpGet("campaigns/{campaignId:int}/users")]
    public async Task<ActionResult<IEnumerable<CampaignUserReportDto>>> GetCampaignUserReport(int campaignId)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var campaign = await _db.Campaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId && c.TenantId == tenantId);
        if (campaign == null) return NotFound();

        var targets = await _db.TargetUsers
            .Where(t => t.TargetGroupId == campaign.TargetGroupId)
            .ToListAsync();

        var events = await _db.CampaignEvents
            .Where(e => e.CampaignId == campaignId)
            .ToListAsync();

        var result = targets.Select(t =>
        {
            var userEvents = events.Where(e => e.TargetUserId == t.Id).ToList();

            return new CampaignUserReportDto
            {
                TargetUserId = t.Id,
                Email = t.Email,
                DisplayName = t.DisplayName,
                Department = t.Department,
                RiskScore = t.RiskScore,
                IncidentCount = t.IncidentCount,
                Sent = userEvents.Any(e => e.EventType == CampaignEventType.Sent.ToCode()),
                Opened = userEvents.Any(e => e.EventType == CampaignEventType.Open.ToCode()),
                Clicked = userEvents.Any(e => e.EventType == CampaignEventType.Click.ToCode()),
                Submitted = userEvents.Any(e => e.EventType == CampaignEventType.Submitted.ToCode()),
                Reported = userEvents.Any(e => e.EventType == CampaignEventType.Reported.ToCode())
            };
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// CSV export for per-user campaign report.
    /// </summary>
    [HttpGet("campaigns/{campaignId:int}/users/export")]
    public async Task<IActionResult> ExportCampaignUserReportCsv(int campaignId)
    {
        var result = await GetCampaignUserReport(campaignId);
        if (result.Result is ObjectResult obj && obj.Value is IEnumerable<CampaignUserReportDto> list)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("TargetUserId,Email,DisplayName,Department,RiskScore,IncidentCount,Sent,Opened,Clicked,Submitted,Reported");
            foreach (var u in list)
            {
                csv.AppendLine($"{u.TargetUserId},\"{u.Email}\",\"{u.DisplayName}\",\"{u.Department}\",{u.RiskScore:F2},{u.IncidentCount},{u.Sent},{u.Opened},{u.Clicked},{u.Submitted},{u.Reported}");
            }
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"campaign_{campaignId}_users.csv");
        }

        return BadRequest(new { error = "Unable to export" });
    }

    /// <summary>
    /// Returns the highest-risk users across the tenant,
    /// sorted by RiskScore desc.[web:171][web:169][web:170]
    /// </summary>
    [HttpGet("risk/high-risk-users")]
    public async Task<ActionResult<IEnumerable<HighRiskUserDto>>> GetHighRiskUsers(
        [FromQuery] int top = 50)
    {
        var tenantId = _tenantResolver.GetTenantId();

        top = Math.Clamp(top, 1, 500);

        var users = await _db.TargetUsers
            .Where(u => u.TenantId == tenantId && u.RiskScore > 0)
            .OrderByDescending(u => u.RiskScore)
            .ThenByDescending(u => u.IncidentCount)
            .Take(top)
            .ToListAsync();

        var dto = users.Select(u => new HighRiskUserDto
        {
            TargetUserId = u.Id,
            Email = u.Email,
            DisplayName = u.DisplayName,
            Department = u.Department,
            RiskScore = u.RiskScore,
            IncidentCount = u.IncidentCount,
            LastIncidentAt = u.LastIncidentAt
        }).ToList();

        return Ok(dto);
    }

    /// <summary>
    /// CSV export of high-risk users (for tenant).
    /// </summary>
    [HttpGet("risk/high-risk-users/export")]
    public async Task<IActionResult> ExportHighRiskUsersCsv([FromQuery] int top = 50)
    {
        var result = await GetHighRiskUsers(top);
        if (result.Result is ObjectResult obj && obj.Value is IEnumerable<HighRiskUserDto> list)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("TargetUserId,Email,DisplayName,Department,RiskScore,IncidentCount,LastIncidentAt");
            foreach (var u in list)
            {
                var last = u.LastIncidentAt?.ToString("O") ?? "";
                csv.AppendLine($"{u.TargetUserId},\"{u.Email}\",\"{u.DisplayName}\",\"{u.Department}\",{u.RiskScore:F2},{u.IncidentCount},\"{last}\"");
            }
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "high_risk_users.csv");
        }

        return BadRequest(new { error = "Unable to export" });
    }

    /// <summary>
    /// Tenant health score based on engagement risk (lower is better).
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetTenantHealth()
    {
        var tenantId = _tenantResolver.GetTenantId();

        var events = await _db.CampaignEvents
            .Where(e => e.TenantId == tenantId)
            .ToListAsync();

        var sent = events.Count(e => e.EventType == CampaignEventType.Sent.ToCode());
        var open = events.Count(e => e.EventType == CampaignEventType.Open.ToCode());
        var click = events.Count(e => e.EventType == CampaignEventType.Click.ToCode());
        var submitted = events.Count(e => e.EventType == CampaignEventType.Submitted.ToCode());
        var reported = events.Count(e => e.EventType == CampaignEventType.Reported.ToCode());

        double Rate(int count) => sent > 0 ? count * 100.0 / sent : 0;

        // Simple weighted risk score (0-100). Lower is better.
        var risk = Math.Clamp(
            Rate(open) * 0.2 + Rate(click) * 0.4 + Rate(submitted) * 0.4 - Rate(reported) * 0.2,
            0,
            100);

        var health = Math.Clamp(100 - risk, 0, 100);

        return Ok(new
        {
            sent,
            openRate = Rate(open),
            clickRate = Rate(click),
            submittedRate = Rate(submitted),
            reportedRate = Rate(reported),
            healthScore = Math.Round(health, 2)
        });
    }

    /// <summary>
    /// 30-day event trend for dashboard charts.
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends([FromQuery] int days = 30)
    {
        var tenantId = _tenantResolver.GetTenantId();
        days = Math.Clamp(days, 7, 120);
        var start = DateTime.UtcNow.Date.AddDays(-days + 1);

        var events = await _db.CampaignEvents
            .Where(e => e.TenantId == tenantId && e.TimestampUtc >= start)
            .ToListAsync();

        var trend = Enumerable.Range(0, days).Select(i =>
        {
            var day = start.AddDays(i);
            var dayEvents = events.Where(e => e.TimestampUtc.Date == day.Date).ToList();
            return new
            {
                date = day.ToString("yyyy-MM-dd"),
                sent = dayEvents.Count(e => e.EventType == CampaignEventType.Sent.ToCode()),
                open = dayEvents.Count(e => e.EventType == CampaignEventType.Open.ToCode()),
                click = dayEvents.Count(e => e.EventType == CampaignEventType.Click.ToCode()),
                submitted = dayEvents.Count(e => e.EventType == CampaignEventType.Submitted.ToCode()),
                reported = dayEvents.Count(e => e.EventType == CampaignEventType.Reported.ToCode())
            };
        });

        return Ok(trend);
    }
}

/// <summary>
/// Per-user campaign behaviour report.
/// </summary>
public class CampaignUserReportDto
{
    public int TargetUserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Department { get; set; }

    public double RiskScore { get; set; }
    public int IncidentCount { get; set; }

    public bool Sent { get; set; }
    public bool Opened { get; set; }
    public bool Clicked { get; set; }
    public bool Submitted { get; set; }
    public bool Reported { get; set; }
}

/// <summary>
/// High-risk user snapshot for dashboards.[web:171][web:169][web:170]
/// </summary>
public class HighRiskUserDto
{
    public int TargetUserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Department { get; set; }

    public double RiskScore { get; set; }
    public int IncidentCount { get; set; }
    public DateTime? LastIncidentAt { get; set; }
}
