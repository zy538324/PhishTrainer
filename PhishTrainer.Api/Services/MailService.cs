using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace PhishTrainer.Api.Services;

/// <summary>
/// Sends phishing simulation emails via Microsoft Graph (when enabled) or SMTP.
/// Records Sent / Bounced events into CampaignEvents.
/// </summary>
public class MailService : IMailService
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;
    private readonly ILogger<MailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    // Simple in-memory token cache per service instance
    private AuthenticationResult? _cachedGraphToken;
    private DateTimeOffset _graphTokenExpiresAtUtc;

    public MailService(
        PhishDbContext db,
        ITenantResolver tenantResolver,
        ILogger<MailService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _tenantResolver = tenantResolver;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
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

        var bodyWithTracking = BuildHtmlBodyWithTracking(htmlBody, trackingToken);

        try
        {
            if (tenant.UseAzureAdSmtp)
            {
                await SendViaGraphAsync(tenant, toAddress, subject, bodyWithTracking, ct);
            }
            else
            {
                var message = BuildMimeMessage(tenant, toAddress, subject, bodyWithTracking);
                await SendViaSmtpAsync(tenant, message, ct);
            }

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
        if (string.IsNullOrWhiteSpace(tenant.SmtpFromAddress))
        {
            throw new InvalidOperationException(
                "Tenant mail configuration is incomplete. " +
                "SmtpFromAddress is required.");
        }

        if (tenant.UseAzureAdSmtp &&
            (string.IsNullOrWhiteSpace(tenant.AzureAdTenantId) ||
             string.IsNullOrWhiteSpace(tenant.AzureAdClientId) ||
             string.IsNullOrWhiteSpace(tenant.AzureAdClientSecret)))
        {
            throw new InvalidOperationException(
                "Azure AD (Graph) configuration is incomplete. " +
                "AzureAdTenantId, AzureAdClientId, and AzureAdClientSecret are required.");
        }

        if (!tenant.UseAzureAdSmtp && (string.IsNullOrWhiteSpace(tenant.SmtpHost) || !tenant.SmtpPort.HasValue))
        {
            throw new InvalidOperationException(
                "SMTP configuration is incomplete. SmtpHost and SmtpPort are required when Azure AD is disabled.");
        }
    }

    private async Task SendViaSmtpAsync(Tenant tenant, MimeMessage message, CancellationToken ct)
    {
        var host = tenant.SmtpHost ?? "smtp.office365.com";
        var port = tenant.SmtpPort ?? 587;
        var socketOptions = port == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;

        using var client = new SmtpClient
        {
            CheckCertificateRevocation = true
        };

        await client.ConnectAsync(host, port, socketOptions, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    private async Task SendViaGraphAsync(Tenant tenant, string to, string subject, string htmlBody, CancellationToken ct)
    {
        var accessToken = await GetGraphAccessTokenAsync(tenant, ct);
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var payload = new
        {
            message = new
            {
                subject,
                body = new { contentType = "HTML", content = htmlBody },
                toRecipients = new[]
                {
                    new { emailAddress = new { address = to } }
                }
            },
            saveToSentItems = "false"
        };

        var from = Uri.EscapeDataString(tenant.SmtpFromAddress!);
        var url = $"https://graph.microsoft.com/v1.0/users/{from}/sendMail";

        using var response = await client.PostAsJsonAsync(url, payload, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Graph sendMail failed: {(int)response.StatusCode} {response.ReasonPhrase} {body}");
        }
    }

    private async Task<string> GetGraphAccessTokenAsync(Tenant tenant, CancellationToken ct)
    {
        if (_cachedGraphToken != null && _graphTokenExpiresAtUtc > DateTimeOffset.UtcNow.AddMinutes(1))
        {
            return _cachedGraphToken.AccessToken;
        }

        var app = ConfidentialClientApplicationBuilder
            .Create(tenant.AzureAdClientId!)
            .WithClientSecret(tenant.AzureAdClientSecret!)
            .WithAuthority($"https://login.microsoftonline.com/{tenant.AzureAdTenantId}")
            .Build();

        var result = await app
            .AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
            .ExecuteAsync(ct);

        _cachedGraphToken = result;
        _graphTokenExpiresAtUtc = result.ExpiresOn;

        return result.AccessToken;
    }

    private static bool IsBounceStatus(SmtpStatusCode statusCode)
    {
        return statusCode == SmtpStatusCode.MailboxUnavailable
            || statusCode == SmtpStatusCode.MailboxNameNotAllowed
            || statusCode == SmtpStatusCode.UserNotLocalTryAlternatePath
            || statusCode == SmtpStatusCode.ExceededStorageAllocation;
    }

    private static string BuildHtmlBodyWithTracking(string htmlBody, string token)
    {
        var bodyWithTracking = htmlBody
            .Replace("{{TrackingPixel}}",
                $"<img src=\"https://phishtrainer.local/api/tracking/o/{token}.png\" " +
                "width=\"1\" height=\"1\" style=\"display:none;\" alt=\"\" />")
            .Replace("{{ClickLink}}",
                $"https://phishtrainer.local/api/tracking/t/{token}");
        return bodyWithTracking;
    }

    private MimeMessage BuildMimeMessage(
        Tenant tenant,
        string to,
        string subject,
        string htmlBody)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            tenant.SmtpDisplayName ?? tenant.Name,
            tenant.SmtpFromAddress ?? string.Empty));

        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        message.Body = new TextPart(MimeKit.Text.TextFormat.Html)
        {
            Text = htmlBody
        };

        return message;
    }
}
