using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;
using PhishTrainer.Api.Security;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/users")]
[RequireRole(Roles.MspAdmin, Roles.TenantAdmin)]
public class UsersController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public UsersController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAll()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var users = await _db.Users
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.Email)
            .ToListAsync();

        return Ok(users.Select(u => new
        {
            u.Id,
            u.Email,
            u.DisplayName,
            u.Role,
            u.IsActive
        }));
    }

    public class UpsertUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = Roles.TenantAdmin;
        public bool IsActive { get; set; } = true;
    }

    public class BulkUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertUserDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { error = "Email is required" });

        var email = dto.Email.Trim().ToLowerInvariant();
        var exists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Email.ToLower() == email);
        if (exists) return Conflict(new { error = "User already exists" });

        var user = new User
        {
            TenantId = tenantId,
            Email = email,
            DisplayName = dto.DisplayName?.Trim() ?? string.Empty,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? Roles.TenantAdmin : dto.Role,
            IsActive = dto.IsActive
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = user.Id }, new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.IsActive
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertUserDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Email))
            user.Email = dto.Email.Trim().ToLowerInvariant();

        user.DisplayName = dto.DisplayName?.Trim() ?? user.DisplayName;
        user.Role = string.IsNullOrWhiteSpace(dto.Role) ? user.Role : dto.Role;
        user.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId);
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public class BulkUserResultDto
    {
        public int Created { get; set; }
        public int Updated { get; set; }
        public int Skipped { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpsert([FromBody] List<BulkUserDto> items)
    {
        var tenantId = _tenantResolver.GetTenantId();

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

            var existing = await _db.Users
                .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email.ToLower() == email);

            if (existing != null)
            {
                existing.DisplayName = item.DisplayName?.Trim() ?? existing.DisplayName;
                if (!string.IsNullOrWhiteSpace(item.Role))
                    existing.Role = item.Role!.Trim();
                if (item.IsActive.HasValue)
                    existing.IsActive = item.IsActive.Value;
                updated++;
            }
            else
            {
                _db.Users.Add(new User
                {
                    TenantId = tenantId,
                    Email = email,
                    DisplayName = item.DisplayName?.Trim() ?? string.Empty,
                    Role = string.IsNullOrWhiteSpace(item.Role) ? Roles.TenantAdmin : item.Role!.Trim(),
                    IsActive = item.IsActive ?? true
                });
                created++;
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new BulkUserResultDto
        {
            Created = created,
            Updated = updated,
            Skipped = skipped,
            Errors = errors
        });
    }

    
}
