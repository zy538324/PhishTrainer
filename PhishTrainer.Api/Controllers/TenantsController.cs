using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Security;
using PhishTrainer.Api.Services; // Add this if ITenantResolver is in the Services namespace

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/tenants")]
[RequireRole(Roles.MspAdmin)]
public class TenantsController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public TenantsController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tenants = await _db.Tenants
            .AsNoTracking()
            .Select(t => new {
                t.Id,
                t.Slug,
                t.Name,
                t.IsActive,
                t.LogoUrl,
                t.PrimaryColorHex
            })
            .ToListAsync();

        return Ok(tenants);
    }

    public class TenantDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? LogoUrl { get; set; }
        public string? PrimaryColorHex { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TenantDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Slug)) return BadRequest(new { error = "Slug is required" });

        var slug = dto.Slug.Trim().ToLowerInvariant();
        if (await _db.Tenants.AnyAsync(t => t.Slug == slug))
            return Conflict(new { error = "A tenant with that slug already exists" });

        var t = new Tenant
        {
            Slug = slug,
            Name = dto.Name?.Trim() ?? string.Empty,
            IsActive = dto.IsActive,
            LogoUrl = dto.LogoUrl,
            PrimaryColorHex = dto.PrimaryColorHex
        };

        _db.Tenants.Add(t);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = t.Id }, new { t.Id, t.Slug, t.Name, t.IsActive });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TenantDto dto)
    {
        var t = await _db.Tenants.FindAsync(id);
        if (t == null) return NotFound(new { error = "Tenant not found" });

        var slug = dto.Slug?.Trim().ToLowerInvariant() ?? t.Slug;
        if (slug != t.Slug && await _db.Tenants.AnyAsync(x => x.Slug == slug && x.Id != id))
            return Conflict(new { error = "A tenant with that slug already exists" });

        t.Slug = slug;
        t.Name = dto.Name?.Trim() ?? t.Name;
        t.IsActive = dto.IsActive;
        t.LogoUrl = dto.LogoUrl;
        t.PrimaryColorHex = dto.PrimaryColorHex;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool force = false)
    {
        var t = await _db.Tenants.FindAsync(id);
        if (t == null) return NotFound(new { error = "Tenant not found" });

        // Ensure tenant context for deleting tenant-owned rows
        _tenantResolver.SetTenant(t.Id, t.Slug);

        var counts = new
        {
            Users = await _db.Users.IgnoreQueryFilters().CountAsync(u => u.TenantId == t.Id),
            Templates = await _db.EmailTemplates.IgnoreQueryFilters().CountAsync(e => e.TenantId == t.Id),
            LandingPages = await _db.LandingPages.IgnoreQueryFilters().CountAsync(l => l.TenantId == t.Id),
            TargetGroups = await _db.TargetGroups.IgnoreQueryFilters().CountAsync(g => g.TenantId == t.Id),
            Targets = await _db.TargetUsers.IgnoreQueryFilters().CountAsync(u => u.TenantId == t.Id),
            Campaigns = await _db.Campaigns.IgnoreQueryFilters().CountAsync(c => c.TenantId == t.Id),
            Events = await _db.CampaignEvents.IgnoreQueryFilters().CountAsync(e => e.TenantId == t.Id),
            EmailQueue = await _db.EmailQueue.IgnoreQueryFilters().CountAsync(q => q.TenantId == t.Id)
        };

        var hasData = counts.Users + counts.Templates + counts.LandingPages + counts.TargetGroups +
                      counts.Targets + counts.Campaigns + counts.Events + counts.EmailQueue > 0;

        if (!force && hasData)
        {
            t.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { status = "deactivated", counts });
        }

        if (hasData)
        {
            _db.CampaignEvents.RemoveRange(_db.CampaignEvents.IgnoreQueryFilters().Where(e => e.TenantId == t.Id));
            _db.EmailQueue.RemoveRange(_db.EmailQueue.IgnoreQueryFilters().Where(q => q.TenantId == t.Id));
            _db.Campaigns.RemoveRange(_db.Campaigns.IgnoreQueryFilters().Where(c => c.TenantId == t.Id));
            _db.TargetUsers.RemoveRange(_db.TargetUsers.IgnoreQueryFilters().Where(u => u.TenantId == t.Id));
            _db.TargetGroups.RemoveRange(_db.TargetGroups.IgnoreQueryFilters().Where(g => g.TenantId == t.Id));
            _db.LandingPages.RemoveRange(_db.LandingPages.IgnoreQueryFilters().Where(l => l.TenantId == t.Id));
            _db.EmailTemplates.RemoveRange(_db.EmailTemplates.IgnoreQueryFilters().Where(e => e.TenantId == t.Id));
            _db.Users.RemoveRange(_db.Users.IgnoreQueryFilters().Where(u => u.TenantId == t.Id));
            await _db.SaveChangesAsync();
        }

        _db.Tenants.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
