using Microsoft.AspNetCore.Mvc;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.DTOs;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly PhishDbContext _db;

    public TemplatesController(PhishDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() => 
        Ok(await _db.EmailTemplates.ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create(CreateTemplateDto dto)
    {
        var template = new EmailTemplate
        {
            Name = dto.Name,
            Subject = dto.Subject,
            HtmlBody = dto.HtmlBody,
            Category = dto.Category,
            CreatedBy = 1 // TODO: from auth
        };
        _db.EmailTemplates.Add(template);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = template.Id }, template);
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromBody] List<CreateTemplateDto> templates)
    {
        foreach (var dto in templates)
        {
            _db.EmailTemplates.Add(new EmailTemplate
            {
                Name = dto.Name,
                Subject = dto.Subject,
                HtmlBody = dto.HtmlBody,
                ImportedFrom = "CSV",
                CreatedBy = 1
            });
        }
        await _db.SaveChangesAsync();
        return Ok(new { imported = templates.Count });
    }
}
