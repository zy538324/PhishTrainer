using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Security;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/admin/overview")]
[RequireRole(Roles.MspAdmin)]
public class AdminOverviewController : ControllerBase
{
    private readonly PhishDbContext _db;

    public AdminOverviewController(PhishDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tenants = await _db.Tenants.AsNoTracking().ToListAsync();

        var campaigns = await _db.Campaigns.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var templates = await _db.EmailTemplates.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var targets = await _db.TargetUsers.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        var events = await _db.CampaignEvents.IgnoreQueryFilters().AsNoTracking().ToListAsync();

        var sentByTenant = events
            .Where(e => e.EventType == CampaignEventType.Sent.ToCode())
            .GroupBy(e => e.TenantId)
            .ToDictionary(g => g.Key, g => g.Count());

        var clickByTenant = events
            .Where(e => e.EventType == CampaignEventType.Click.ToCode())
            .GroupBy(e => e.TenantId)
            .ToDictionary(g => g.Key, g => g.Count());

        var openByTenant = events
            .Where(e => e.EventType == CampaignEventType.Open.ToCode())
            .GroupBy(e => e.TenantId)
            .ToDictionary(g => g.Key, g => g.Count());

        var perTenant = tenants.Select(t => new
        {
            tenantId = t.Id,
            slug = t.Slug,
            name = t.Name,
            isActive = t.IsActive,
            campaigns = campaigns.Count(c => c.TenantId == t.Id),
            templates = templates.Count(tp => tp.TenantId == t.Id),
            targets = targets.Count(u => u.TenantId == t.Id),
            sent = sentByTenant.TryGetValue(t.Id, out var s) ? s : 0,
            open = openByTenant.TryGetValue(t.Id, out var o) ? o : 0,
            click = clickByTenant.TryGetValue(t.Id, out var c) ? c : 0
        }).ToList();

        var totals = new
        {
            tenants = tenants.Count,
            activeTenants = tenants.Count(t => t.IsActive),
            campaigns = campaigns.Count,
            templates = templates.Count,
            targets = targets.Count,
            sent = events.Count(e => e.EventType == CampaignEventType.Sent.ToCode()),
            open = events.Count(e => e.EventType == CampaignEventType.Open.ToCode()),
            click = events.Count(e => e.EventType == CampaignEventType.Click.ToCode())
        };

        return Ok(new { totals, tenants = perTenant });
    }
}
