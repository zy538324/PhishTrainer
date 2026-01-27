using Microsoft.AspNetCore.Authorization;
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
[Authorize]
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
