using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;
using PhishTrainer.Api.Security;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Manages phishing targets:
/// - CRUD for target groups
/// - CRUD for individual targets
/// - Simple bulk-add endpoint (JSON array)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[RequireRole(Roles.MspAdmin, Roles.TenantAdmin, Roles.Analyst)]
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

    public class CreateTargetGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    [HttpPost("groups")]
    public async Task<ActionResult<TargetGroup>> CreateGroup([FromBody] CreateTargetGroupDto dto)
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
    public async Task<IActionResult> UpdateGroup(int id, [FromBody] CreateTargetGroupDto dto)
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

    public class CreateTargetUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Department { get; set; }
        public string? ManagerEmail { get; set; }
        public string? Location { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpPost("groups/{groupId:int}/targets")]
    public async Task<ActionResult<TargetUser>> AddTarget(int groupId, [FromBody] CreateTargetUserDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();

        var group = await _db.TargetGroups.FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return NotFound("Target group not found.");

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest("Email is required.");

        var email = dto.Email.Trim().ToLowerInvariant();
        if (!email.Contains("@"))
            return BadRequest("Invalid email address.");

        var existing = await _db.TargetUsers
            .FirstOrDefaultAsync(t => t.Email == email && t.TenantId == tenantId);

        if (existing != null)
        {
            // If already exists in another group, just move it
            existing.TargetGroupId = groupId;
            existing.DisplayName = dto.DisplayName ?? existing.DisplayName;
            existing.Department = dto.Department ?? existing.Department;
            existing.ManagerEmail = dto.ManagerEmail ?? existing.ManagerEmail;
            existing.Location = dto.Location ?? existing.Location;
            existing.IsActive = dto.IsActive ?? true;

            await _db.SaveChangesAsync();
            return Ok(new
            {
                existing.Id,
                existing.TargetGroupId,
                existing.Email,
                existing.DisplayName,
                existing.Department,
                existing.ManagerEmail,
                existing.Location,
                existing.IsActive
            });
        }

        var target = new TargetUser
        {
            TenantId = tenantId,
            TargetGroupId = groupId,
            Email = email,
            DisplayName = dto.DisplayName ?? string.Empty,
            Department = dto.Department,
            ManagerEmail = dto.ManagerEmail,
            Location = dto.Location,
            IsActive = dto.IsActive ?? true
        };

        _db.TargetUsers.Add(target);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTargets), new { groupId, id = target.Id }, new
        {
            target.Id,
            target.TargetGroupId,
            target.Email,
            target.DisplayName,
            target.Department,
            target.ManagerEmail,
            target.Location,
            target.IsActive
        });
    }

    [HttpPut("targets/{id:int}")]
    public async Task<IActionResult> UpdateTarget(int id, [FromBody] CreateTargetUserDto dto)
    {
        var target = await _db.TargetUsers.FirstOrDefaultAsync(t => t.Id == id);
        if (target == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.DisplayName))
            target.DisplayName = dto.DisplayName;
        if (dto.Department != null)
            target.Department = dto.Department;
        if (dto.ManagerEmail != null)
            target.ManagerEmail = dto.ManagerEmail;
        if (dto.Location != null)
            target.Location = dto.Location;
        if (dto.IsActive.HasValue)
            target.IsActive = dto.IsActive.Value;

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
        int skipped = 0;
        var errors = new List<string>();

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            if (string.IsNullOrWhiteSpace(item.Email))
            {
                skipped++;
                errors.Add($"Row {i + 1}: Email is required");
                continue;
            }

            var email = item.Email.Trim().ToLowerInvariant();
            if (!email.Contains("@"))
            {
                skipped++;
                errors.Add($"Row {i + 1}: Invalid email '{email}'");
                continue;
            }

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
            Updated = updated,
            Skipped = skipped,
            Errors = errors
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
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = new();
}
