using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/tenants")]
public class TenantsController : ControllerBase
{
    private readonly PhishDbContext _db;

    public TenantsController(PhishDbContext db)
    {
        _db = db;
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
    public async Task<IActionResult> Delete(int id)
    {
        var t = await _db.Tenants.FindAsync(id);
        if (t == null) return NotFound(new { error = "Tenant not found" });

        _db.Tenants.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
