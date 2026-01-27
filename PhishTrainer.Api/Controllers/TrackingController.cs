using Microsoft.AspNetCore.Mvc;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("")]
public class TrackingController : ControllerBase
{
    private readonly PhishDbContext _db;

    public TrackingController(PhishDbContext db) => _db = db;

    [HttpGet("t/{token}")]
    public async Task<IActionResult> TrackClick(string token)
    {
        // Decode token to get campaignId + targetUserId
        var parts = DecodeToken(token);
        
        _db.CampaignEvents.Add(new CampaignEvent
        {
            TenantId = parts.TenantId,
            CampaignId = parts.CampaignId,
            TargetUserId = parts.TargetId,
            EventType = "Click"
        });
        await _db.SaveChangesAsync();

        return Redirect($"https://yourapp.com/landing/{parts.CampaignId}");
    }

    [HttpGet("o/{token}.png")]
    public async Task<IActionResult> TrackOpen(string token)
    {
        var parts = DecodeToken(token);
        
        _db.CampaignEvents.Add(new CampaignEvent
        {
            TenantId = parts.TenantId,
            CampaignId = parts.CampaignId,
            TargetUserId = parts.TargetId,
            EventType = "Open"
        });
        await _db.SaveChangesAsync();

        return File(new byte[] { /* 1x1 transparent GIF bytes */ }, "image/gif");
    }

    private (int TenantId, int CampaignId, int TargetId) DecodeToken(string token)
    {
        // TODO: implement secure token encoding/decoding
        return (1, 1, 1);
    }
}
