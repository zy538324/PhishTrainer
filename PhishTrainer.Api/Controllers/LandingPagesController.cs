using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Security;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/landing-pages")]
[RequireRole(Roles.MspAdmin, Roles.TenantAdmin, Roles.Analyst)]
public class LandingPagesController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public LandingPagesController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tenantId = _tenantResolver.GetTenantId();
        var pages = await _db.LandingPages
            .Where(l => l.TenantId == tenantId)
            .OrderBy(l => l.Name)
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.RedirectUrl,
                l.CollectCredentials,
                l.MaskCredentials,
                l.CreatedAt
            })
            .ToListAsync();

        return Ok(pages);
    }

    public class CreateLandingPageDto
    {
        public string Name { get; set; } = string.Empty;
        public string HtmlBody { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;
        public bool CollectCredentials { get; set; } = false;
        public bool MaskCredentials { get; set; } = true;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLandingPageDto dto)
    {
        var tenantId = _tenantResolver.GetTenantId();
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.HtmlBody))
        {
            return BadRequest("Name and HTML body are required.");
        }

        var page = new LandingPageTemplate
        {
            TenantId = tenantId,
            Name = dto.Name.Trim(),
            HtmlBody = dto.HtmlBody,
            RedirectUrl = string.IsNullOrWhiteSpace(dto.RedirectUrl) ? "https://example.com" : dto.RedirectUrl.Trim(),
            CollectCredentials = dto.CollectCredentials,
            MaskCredentials = dto.MaskCredentials
        };

        _db.LandingPages.Add(page);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = page.Id }, new
        {
            page.Id,
            page.Name,
            page.RedirectUrl,
            page.CollectCredentials,
            page.MaskCredentials,
            page.CreatedAt
        });
    }
}
