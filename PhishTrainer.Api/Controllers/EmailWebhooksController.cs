using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/webhooks/email")]
public class EmailWebhooksController : ControllerBase
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public EmailWebhooksController(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    public class EmailWebhookDto
    {
        public string? TenantSlug { get; set; }
        public string EventType { get; set; } = string.Empty; // bounce | complaint
        public int? CampaignId { get; set; }
        public int? TargetUserId { get; set; }
        public string? TargetEmail { get; set; }
        public string? Provider { get; set; }
        public string? RawJson { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] EmailWebhookDto dto)
    {
        var slug = (dto.TenantSlug ?? Request.Headers["X-Tenant"].FirstOrDefault() ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug))
            return BadRequest(new { error = "TenantSlug is required" });

        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive);
        if (tenant == null) return NotFound(new { error = "Tenant not found" });

        _tenantResolver.SetTenant(tenant.Id, tenant.Slug);

        int? targetUserId = dto.TargetUserId;
        if (!targetUserId.HasValue && !string.IsNullOrWhiteSpace(dto.TargetEmail))
        {
            var email = dto.TargetEmail.Trim().ToLowerInvariant();
            var target = await _db.TargetUsers.FirstOrDefaultAsync(t => t.Email.ToLower() == email);
            targetUserId = target?.Id;
        }

        if (!targetUserId.HasValue || !dto.CampaignId.HasValue)
            return BadRequest(new { error = "CampaignId and TargetUserId (or TargetEmail) are required" });

        var type = dto.EventType.Trim().ToLowerInvariant();
        var eventType = type switch
        {
            "bounce" => CampaignEventType.Bounced.ToCode(),
            "complaint" => CampaignEventType.Reported.ToCode(),
            _ => "Unknown"
        };

        var metadata = System.Text.Json.JsonSerializer.Serialize(new
        {
            provider = dto.Provider,
            raw = dto.RawJson
        });

        _db.CampaignEvents.Add(new CampaignEvent
        {
            TenantId = tenant.Id,
            CampaignId = dto.CampaignId.Value,
            TargetUserId = targetUserId.Value,
            EventType = eventType,
            TimestampUtc = DateTime.UtcNow,
            MetadataJson = metadata
        });

        await _db.SaveChangesAsync();
        return Ok(new { status = "received" });
    }
}
