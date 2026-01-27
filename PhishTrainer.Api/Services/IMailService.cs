using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services;

public class MailService : IMailService
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<MailService> _logger;

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

        var message = BuildMimeMessage(tenant, toAddress, subject, htmlBody, trackingToken);

        try
        {
            await SendViaSmtpAsync(tenant, message, ct);

            _db.CampaignEvents.Add(new CampaignEvent
            {
                TenantId = tenantId,
                CampaignId = campaignId,
                TargetUserId = targetUserId,
                EventType = CampaignEventType.Sent.ToCode(),
                TimestampUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);
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
        var accessToken = await GetAccessTokenAsync(tenant, ct);

        using var client = new SmtpClient { CheckCertificateRevocation = true };

        await client.ConnectAsync("smtp.office365.com", 587, SecureSocketOptions.StartTls, ct);

        var oauth2 = new SaslMechanismOAuth2(tenant.SmtpFromAddress!, accessToken);
        await client.AuthenticateAsync(oauth2, ct);

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    private async Task<string> GetAccessTokenAsync(Tenant tenant, CancellationToken ct)
    {
        if (_cachedToken != null && _tokenExpiresAtUtc > DateTimeOffset.UtcNow.AddMinutes(1))
            return _cachedToken.AccessToken;

        var app = ConfidentialClientApplicationBuilder
            .Create(tenant.AzureAdClientId!)
            .WithClientSecret(tenant.AzureAdClientSecret!)
            .WithAuthority($"https://login.microsoftonline.com/{tenant.AzureAdTenantId}")
            .Build();

        var result = await app
            .AcquireTokenForClient(new[] { "https://outlook.office365.com/.default" })
            .ExecuteAsync(ct);

        _cachedToken = result;
        _tokenExpiresAtUtc = result.ExpiresOn;

        return result.AccessToken;
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

        var bodyWithTracking = htmlBody
            .Replace("{{TrackingPixel}}",
                $"<img src=\"https://phishtrainer.local/api/tracking/o/{token}.png\" width=\"1\" height=\"1\" style=\"display:none;\" alt=\"\" />")
            .Replace("{{ClickLink}}",
                $"https://phishtrainer.local/api/tracking/t/{token}");

        message.Body = new TextPart(MimeKit.Text.TextFormat.Html)
        {
            Text = bodyWithTracking
        };

        return message;
    }
}
