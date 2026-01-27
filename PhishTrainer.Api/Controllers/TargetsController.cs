using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Manages phishing targets:
/// - CRUD for target groups
/// - CRUD for individual targets
/// - Simple bulk-add endpoint (JSON array)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TargetsController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<TargetsController> _logger;

    public TargetsController(
        PhishDbContext db,
        ITenantResolver tenantResolver,
        ILogger<TargetsController> logger)
    {
        _db = db;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    // ---------- Target Groups ----------

    /// <summary>
    /// Returns all target groups for the current tenant, including counts of active targets.[web:178][web:183]
    /// </summary>
    [HttpGet("groups")]
    public async Task<ActionResult<IEnumerable<TargetGroupSummaryDto>>> GetGroups()
    {
        var groups = await _db.TargetGroups
            .Include(g => g.Targets)
            .OrderBy(g => g.Name)
            .ToListAsync();

        var dto = groups.Select(g => new TargetGroupSummaryDto
        {
            Id = g.Id,
            Name = g.Name,
            Description = g.Description,
            ActiveTargets = g.Targets.Count(t => t.IsActive),
            TotalTargets = g.Targets.Count
        }).ToList();

        return Ok(dto);
    }

    [HttpGet("groups/{id:int}")]
    public async Task<ActionResult<TargetGroup>> GetGroup(int id)
    {
        var group = await _db.TargetGroups
            .Include(g => g.Targets)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null) return NotFound();
        return Ok(group);
    }

    [HttpPost("groups")]
    public async Task<ActionResult<TargetGroup>> CreateGroup([FromBody] TargetGroup dto)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var group = new TargetGroup
        {
            TenantId = tenantId,
            Name = dto.Name,
            Description = dto.Description
        };

        _db.TargetGroups.Add(group);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
    }

    [HttpPut("groups/{id:int}")]
    public async Task<IActionResult> UpdateGroup(int id, [FromBody] TargetGroup dto)
    {
        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();

        group.Name = dto.Name;
        group.Description = dto.Description;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("groups/{id:int}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();

        var hasCampaigns = await _db.Campaigns.AnyAsync(c => c.TargetGroupId == id);
        if (hasCampaigns)
        {
            return BadRequest("Cannot delete group while campaigns still reference it.");
        }

        _db.TargetGroups.Remove(group);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Individual Targets ----------

    /// <summary>
    /// Returns targets in a group (optionally only active ones).
    /// </summary>
    [HttpGet("groups/{groupId:int}/targets")]
    public async Task<ActionResult<IEnumerable<TargetUser>>> GetTargets(
        int groupId,
        [FromQuery] bool activeOnly = true)
    {
        var query = _db.TargetUsers.Where(t => t.TargetGroupId == groupId);

        if (activeOnly)
            query = query.Where(t => t.IsActive);

        var targets = await query
            .OrderBy(t => t.Email)
            .ToListAsync();

        return Ok(targets);
    }

    [HttpPost("groups/{groupId:int}/targets")]
    public async Task<ActionResult<TargetUser>> AddTarget(int groupId, [FromBody] TargetUser dto)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return NotFound("Target group not found.");

        var existing = await _db.TargetUsers
            .FirstOrDefaultAsync(t => t.Email == dto.Email && t.TenantId == tenantId);

        if (existing != null)
        {
            // If already exists in another group, just move it
            existing.TargetGroupId = groupId;
            existing.DisplayName = dto.DisplayName;
            existing.Department = dto.Department;
            existing.ManagerEmail = dto.ManagerEmail;
            existing.Location = dto.Location;
            existing.IsActive = true;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        var target = new TargetUser
        {
            TenantId = tenantId,
            TargetGroupId = groupId,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            Department = dto.Department,
            ManagerEmail = dto.ManagerEmail,
            Location = dto.Location,
            IsActive = true
        };

        _db.TargetUsers.Add(target);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTargets), new { groupId, id = target.Id }, target);
    }

    [HttpPut("targets/{id:int}")]
    public async Task<IActionResult> UpdateTarget(int id, [FromBody] TargetUser dto)
    {
        var target = await _db.TargetUsers.FirstOrDefaultAsync(t => t.Id == id);
        if (target == null) return NotFound();

        target.DisplayName = dto.DisplayName;
        target.Department = dto.Department;
        target.ManagerEmail = dto.ManagerEmail;
        target.Location = dto.Location;
        target.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("targets/{id:int}")]
    public async Task<IActionResult> DeleteTarget(int id)
    {
        var target = await _db.TargetUsers.FirstOrDefaultAsync(t => t.Id == id);
        if (target == null) return NotFound();

        _db.TargetUsers.Remove(target);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Bulk operations ----------

    public class BulkTargetDto
    {
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? ManagerEmail { get; set; }
        public string? Location { get; set; }
    }

    /// <summary>
    /// Bulk-add or update targets using a simple JSON array.
    /// (CSV import can be built on top of this in the UI.)[web:182][web:184][web:189]
    /// </summary>
    [HttpPost("groups/{groupId:int}/targets/bulk")]
    public async Task<ActionResult<BulkResultDto>> BulkAddTargets(
        int groupId,
        [FromBody] List<BulkTargetDto> items)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return NotFound("Target group not found.");

        int created = 0;
        int updated = 0;

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Email))
                continue;

            var email = item.Email.Trim().ToLowerInvariant();

            var existing = await _db.TargetUsers
                .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Email == email);

            if (existing != null)
            {
                existing.TargetGroupId = groupId;
                existing.DisplayName = item.DisplayName;
                existing.Department = item.Department;
                existing.ManagerEmail = item.ManagerEmail;
                existing.Location = item.Location;
                existing.IsActive = true;
                updated++;
            }
            else
            {
                _db.TargetUsers.Add(new TargetUser
                {
                    TenantId = tenantId,
                    TargetGroupId = groupId,
                    Email = email,
                    DisplayName = item.DisplayName,
                    Department = item.Department,
                    ManagerEmail = item.ManagerEmail,
                    Location = item.Location,
                    IsActive = true
                });
                created++;
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new BulkResultDto
        {
            Created = created,
            Updated = updated
        });
    }
}

public class TargetGroupSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ActiveTargets { get; set; }
    public int TotalTargets { get; set; }
}

public class BulkResultDto
{
    public int Created { get; set; }
    public int Updated { get; set; }
}
