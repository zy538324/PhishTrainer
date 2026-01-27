using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services;

/// <summary>
/// Sends phishing simulation emails via Microsoft 365 using SMTP + OAuth2 (client credentials).
/// Records Sent / Bounced events into CampaignEvents.
/// </summary>
public class MailService : IMailService
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<MailService> _logger;

    // Simple in-memory token cache per service instance
    private AuthenticationResult? _cachedToken;
    private DateTimeOffset _tokenExpiresAtUtc;

    public MailService(
        PhishDbContext db,
        ITenantResolver tenantResolver,
        ILogger<MailService> logger)
    {
        _db = db;
        _tenantResolver = tenantResolver;
        _logger = logger;
    }

    public async Task SendPhishingMailAsync(
        int campaignId,
        int targetUserId,
        string toAddress,
        string subject,
        string htmlBody,
        string trackingToken,
        CancellationToken ct = default)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FirstAsync(t => t.Id == tenantId, ct);

        ValidateTenantMailConfig(tenant);

        MimeMessage message = BuildMimeMessage(tenant, toAddress, subject, htmlBody, trackingToken);

        try
        {
            await SendViaSmtpAsync(tenant, message, ct);

            // Record Sent event
            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetUserId,
                EventType = CampaignEventType.Sent.ToCode(),
                TimestampUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Email sent to {Email} for campaign {CampaignId}", toAddress, campaignId);
        }
        catch (SmtpCommandException ex) when (IsBounceStatus(ex.StatusCode))
        {
            // Record Bounced event
            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetUserId,
                EventType = CampaignEventType.Bounced.ToCode(),
                TimestampUtc = DateTime.UtcNow,
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    status = ex.StatusCode.ToString(),
                    message = ex.Message
                })
            });

            await _db.SaveChangesAsync(ct);
            _logger.LogWarning(ex, "Bounce for {Email}", toAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toAddress);
            throw;
        }
    }

    private static void ValidateTenantMailConfig(Tenant tenant)
    {
        if (string.IsNullOrWhiteSpace(tenant.AzureAdTenantId) ||
            string.IsNullOrWhiteSpace(tenant.AzureAdClientId) ||
            string.IsNullOrWhiteSpace(tenant.AzureAdClientSecret) ||
            string.IsNullOrWhiteSpace(tenant.SmtpFromAddress))
        {
            throw new InvalidOperationException(
                "Tenant mail configuration is incomplete. " +
                "AzureAdTenantId, AzureAdClientId, AzureAdClientSecret, and SmtpFromAddress are required.");
        }
    }

    private async Task SendViaSmtpAsync(Tenant tenant, MimeMessage message, CancellationToken ct)
    {
        // Get or refresh OAuth2 token using client credentials flow
        var accessToken = await GetAccessTokenAsync(tenant, ct);

        using var client = new SmtpClient
        {
            CheckCertificateRevocation = true
        };

        // Microsoft 365 SMTP endpoint with STARTTLS + XOAUTH2[web:17][web:120]
        await client.ConnectAsync("smtp.office365.com", 587, SecureSocketOptions.StartTls, ct);

        var oauth2 = new MailKit.Security.SaslMechanismOAuth2(
            tenant.SmtpFromAddress!,
            accessToken);

        await client.AuthenticateAsync(oauth2, ct);

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    private async Task<string> GetAccessTokenAsync(Tenant tenant, CancellationToken ct)
    {
        // Reuse token until ~1 minute before expiration to reduce Azure AD calls[web:115][web:120]
        if (_cachedToken != null && _tokenExpiresAtUtc > DateTimeOffset.UtcNow.AddMinutes(1))
        {
            return _cachedToken.AccessToken;
        }

        var app = ConfidentialClientApplicationBuilder
            .Create(tenant.AzureAdClientId!)
            .WithClientSecret(tenant.AzureAdClientSecret!)
            .WithAuthority($"https://login.microsoftonline.com/{tenant.AzureAdTenantId}")
            .Build();

        // For SMTP, use "https://outlook.office365.com/.default" as scope[web:17][web:115][web:117]
        var result = await app
            .AcquireTokenForClient(new[] { "https://outlook.office365.com/.default" })
            .ExecuteAsync(ct);

        _cachedToken = result;
        _tokenExpiresAtUtc = result.ExpiresOn;

        return result.AccessToken;
    }

    private static bool IsBounceStatus(SmtpStatusCode statusCode)
    {
        // Basic classification of SMTP codes that represent delivery issues[web:115][web:118]
        return statusCode == SmtpStatusCode.MailboxUnavailable
            || statusCode == SmtpStatusCode.MailboxNameNotAllowed
            || statusCode == SmtpStatusCode.UserNotLocalTryAlternatePath
            || statusCode == SmtpStatusCode.ExceededStorageAllocation;
    }

    private MimeMessage BuildMimeMessage(
        Tenant tenant,
        string to,
        string subject,
        string htmlBody,
        string token)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            tenant.SmtpDisplayName ?? tenant.Name,
            tenant.SmtpFromAddress ?? string.Empty));

        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        // Inject tracking elements:
        // - {{TrackingPixel}} -> open tracker
        // - {{ClickLink}} -> click tracker[web:119][web:121][web:122]
        var bodyWithTracking = htmlBody
            .Replace("{{TrackingPixel}}",
                $"<img src=\"https://phishtrainer.local/api/tracking/o/{token}.png\" " +
                "width=\"1\" height=\"1\" style=\"display:none;\" alt=\"\" />")
            .Replace("{{ClickLink}}",
                $"https://phishtrainer.local/api/tracking/t/{token}");

        message.Body = new TextPart(MimeKit.Text.TextFormat.Html)
        {
            Text = bodyWithTracking
        };

        return message;
    }
}
