using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.DTOs;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Manages phishing campaigns:
/// - List, get, create, clone, schedule, and launch campaigns.
/// - Get per-campaign summary stats.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CampaignsController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ICampaignService _campaignService;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<CampaignsController> _logger;

    public CampaignsController(
        PhishDbContext db,
        ICampaignService campaignService,
        ITenantResolver tenantResolver,
        ILogger<CampaignsController> logger)
    {
        _db = db;
        _campaignService = campaignService;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    // ---------- Queries ----------

    /// <summary>
    /// Returns all campaigns for the current tenant, newest first.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Campaign>>> GetAll()
    {
        var campaigns = await _db.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.LandingPage)
            .Include(c => c.TargetGroup)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return Ok(campaigns);
    }

    /// <summary>
    /// Returns a single campaign with related data.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Campaign>> GetById(int id)
    {
        var campaign = await _db.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.LandingPage)
            .Include(c => c.TargetGroup)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (campaign == null)
            return NotFound();

        return Ok(campaign);
    }

    // ---------- Commands ----------

    /// <summary>
    /// Creates a new campaign in Draft or Scheduled state.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Campaign>> Create([FromBody] CreateCampaignDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var tenantId = _tenantResolver.GetTenantId();

        // Validate foreign keys belong to this tenant (global filters help, but we still check)
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == dto.TemplateId);
        var landingPage = await _db.LandingPages.FirstOrDefaultAsync(l => l.Id == dto.LandingPageId);
        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == dto.TargetGroupId);

        if (template == null || landingPage == null || group == null)
        {
            return BadRequest("Template, landing page, and target group must exist for this tenant.");
        }

        var campaign = new Campaign
        {
            TenantId = tenantId,
            Name = dto.Name,
            EmailTemplateId = dto.TemplateId,
            LandingPageId = dto.LandingPageId,
            TargetGroupId = dto.TargetGroupId,
            ScheduledAtUtc = dto.ScheduledAtUtc,
            ThrottlePerMinute = dto.ThrottlePerMinute,
            Status = dto.ScheduledAtUtc.HasValue ? "Scheduled" : "Draft",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Campaigns.Add(campaign);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = campaign.Id }, campaign);
    }

    /// <summary>
    /// Clones an existing campaign (without its events).
    /// Lets admins quickly re-run similar tests.[web:119][web:152]
    /// </summary>
    [HttpPost("{id:int}/clone")]
    public async Task<ActionResult<Campaign>> Clone(int id)
    {
        var original = await _db.Campaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (original == null) return NotFound();

        var clone = new Campaign
        {
            TenantId = original.TenantId,
            Name = original.Name + " (Clone)",
            EmailTemplateId = original.EmailTemplateId,
            LandingPageId = original.LandingPageId,
            TargetGroupId = original.TargetGroupId,
            Status = "Draft",
            ThrottlePerMinute = original.ThrottlePerMinute,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Campaigns.Add(clone);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = clone.Id }, clone);
    }

    /// <summary>
    /// Schedules a campaign for a future date/time (stored in UTC).
    /// </summary>
    [HttpPost("{id:int}/schedule")]
    public async Task<IActionResult> Schedule(int id, [FromBody] DateTime scheduledAtUtc)
    {
        var campaign = await _db.Campaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (campaign == null) return NotFound();

        if (scheduledAtUtc <= DateTime.UtcNow)
            return BadRequest("Scheduled time must be in the future.");

        campaign.ScheduledAtUtc = scheduledAtUtc;
        campaign.Status = "Scheduled";

        await _db.SaveChangesAsync();
        return Ok(campaign);
    }

    /// <summary>
    /// Launches a campaign immediately.
    /// </summary>
    [HttpPost("{id:int}/launch")]
    public async Task<IActionResult> Launch(int id, CancellationToken ct)
    {
        try
        {
            await _campaignService.LaunchCampaignAsync(id, ct);
            return Ok(new { status = "launched" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot launch campaign {CampaignId}", id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error launching campaign {CampaignId}", id);
            return StatusCode(500, new { error = "Failed to launch campaign." });
        }
    }

    // ---------- Summary / lightweight reporting ----------

    /// <summary>
    /// Returns summary stats (Sent/Open/Click/Submitted/Reported and rates).
    /// </summary>
    [HttpGet("{id:int}/summary")]
    public async Task<ActionResult<CampaignSummaryDto>> GetSummary(int id)
    {
        var campaign = await _db.Campaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (campaign == null) return NotFound();

        var events = await _db.CampaignEvents
            .Where(e => e.CampaignId == id)
            .ToListAsync();

        int totalSent = events.Count(e => e.EventType == CampaignEventType.Sent.ToCode());
        int totalOpen = events.Count(e => e.EventType == CampaignEventType.Open.ToCode());
        int totalClick = events.Count(e => e.EventType == CampaignEventType.Click.ToCode());
        int totalSubmitted = events.Count(e => e.EventType == CampaignEventType.Submitted.ToCode());
        int totalReported = events.Count(e => e.EventType == CampaignEventType.Reported.ToCode());

        double Rate(int count) => totalSent > 0 ? count * 100.0 / totalSent : 0;

        var dto = new CampaignSummaryDto
        {
            CampaignId = id,
            Name = campaign.Name,
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

        return Ok(dto);
    }
}
