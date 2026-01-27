using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.DTOs;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;
using PhishTrainer.Api.Security;

namespace PhishTrainer.Api.Controllers;

/// <summary>
/// Manages phishing email templates:
/// - List, filter, get, create, update, delete.
/// - Ensures required tracking placeholders are present.
/// - Supports category and difficulty metadata.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[RequireRole(Roles.MspAdmin, Roles.TenantAdmin, Roles.Analyst)]
public class TemplatesController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(
        PhishDbContext db,
        ITenantResolver tenantResolver,
        ILogger<TemplatesController> logger)
    {
        _db = db;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    // ---------- Queries ----------

    /// <summary>
    /// Lists templates, optionally filtered by category or difficulty.
    /// Difficulty can be values like Easy/Medium/Hard.[web:193][web:194][web:201]
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmailTemplate>>> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] string? difficulty = null)
    {
        var query = _db.EmailTemplates.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var cat = category.Trim().ToLowerInvariant();
            query = query.Where(t => t.Category != null &&
                                     t.Category.ToLower() == cat);
        }

        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            var diff = difficulty.Trim().ToLowerInvariant();
            query = query.Where(t => t.Difficulty != null &&
                                     t.Difficulty.ToLower() == diff);
        }

        var templates = await query
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(templates);
    }

    /// <summary>
    /// Returns a single template by id.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmailTemplate>> GetById(int id)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id);
        if (template == null) return NotFound();

        return Ok(template);
    }

    // ---------- Commands ----------

    /// <summary>
    /// Creates a new phishing email template.
    /// Requires {{TrackingPixel}} and {{ClickLink}} placeholders in HtmlBody.[web:141][web:190][web:193]
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EmailTemplate>> Create([FromBody] CreateTemplateDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var validationError = ValidateTemplateBody(dto.HtmlBody);
        if (validationError is not null)
            return BadRequest(validationError);

        var tenantId = _tenantResolver.GetTenantId();

        var template = new EmailTemplate
        {
            TenantId = tenantId,
            Name = dto.Name,
            Subject = dto.Subject,
            HtmlBody = dto.HtmlBody,
            Category = dto.Category,
            Difficulty = dto.Difficulty,
            TagsCsv = dto.TagsCsv,
            CreatedByUserId = 0, // TODO: map from authenticated user
            CreatedAt = DateTime.UtcNow
        };

        _db.EmailTemplates.Add(template);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Template {TemplateId} created for tenant {TenantId}",
            template.Id, tenantId);

        return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
    }

    /// <summary>
    /// Updates an existing template (body, subject, metadata).
    /// Also validates tracking placeholders.[web:193][web:195][web:201]
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateTemplateDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id);
        if (template == null) return NotFound();

        var validationError = ValidateTemplateBody(dto.HtmlBody);
        if (validationError is not null)
            return BadRequest(validationError);

        template.Name = dto.Name;
        template.Subject = dto.Subject;
        template.HtmlBody = dto.HtmlBody;
        template.Category = dto.Category;
        template.Difficulty = dto.Difficulty;
        template.TagsCsv = dto.TagsCsv;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Template {TemplateId} updated", id);
        return NoContent();
    }

    /// <summary>
    /// Deletes a template if no campaigns reference it.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id);
        if (template == null) return NotFound();

        var inUse = await _db.Campaigns.AnyAsync(c => c.EmailTemplateId == id);
        if (inUse)
        {
            return BadRequest("Cannot delete template while campaigns still reference it.");
        }

        _db.EmailTemplates.Remove(template);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Template {TemplateId} deleted", id);
        return NoContent();
    }

    /// <summary>
    /// Clones an existing template for quick variations.
    /// </summary>
    [HttpPost("{id:int}/clone")]
    public async Task<ActionResult<EmailTemplate>> Clone(int id)
    {
        var existing = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id);
        if (existing == null) return NotFound();

        var clone = new EmailTemplate
        {
            TenantId = existing.TenantId,
            Name = existing.Name + " (Clone)",
            Subject = existing.Subject,
            HtmlBody = existing.HtmlBody,
            Category = existing.Category,
            Difficulty = existing.Difficulty,
            TagsCsv = existing.TagsCsv,
            ImportedFrom = existing.ImportedFrom,
            CreatedByUserId = existing.CreatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.EmailTemplates.Add(clone);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = clone.Id }, clone);
    }

    // ---------- Helpers ----------

    /// <summary>
    /// Ensures the template has the key tracking placeholders so your analytics work.
    /// </summary>
    private static string? ValidateTemplateBody(string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(htmlBody))
            return "HtmlBody is required.";

        if (!htmlBody.Contains("{{TrackingPixel}}", StringComparison.Ordinal))
        {
            return "Template HtmlBody must contain the {{TrackingPixel}} placeholder.";
        }

        if (!htmlBody.Contains("{{ClickLink}}", StringComparison.Ordinal))
        {
            return "Template HtmlBody must contain the {{ClickLink}} placeholder.";
        }

        return null;
    }
}
