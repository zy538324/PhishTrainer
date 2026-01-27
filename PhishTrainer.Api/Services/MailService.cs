using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Identity.Client;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Services;

public interface IMailService
{
    Task SendAsync(string to, string subject, string htmlBody, string trackingToken);
}

public class MailService : IMailService
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public MailService(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, string trackingToken)
    {
        var tenantId = _tenantResolver.GetTenantId();
        var tenant = await _db.Tenants.FindAsync(tenantId);
        if (tenant == null) throw new InvalidOperationException("Tenant not found");

        // Get OAuth2 token
        var app = ConfidentialClientApplicationBuilder.Create(tenant.ClientId)
            .WithClientSecret(tenant.ClientSecret)
            .WithAuthority($"https://login.microsoftonline.com/{tenant.TenantIdAzure}")
            .Build();

        var result = await app.AcquireTokenForClient(new[] { "https://outlook.office365.com/.default" })
            .ExecuteAsync();

        // Build email with tracking
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(tenant.Name, tenant.SmtpFromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        // Inject tracking pixel and links
        var bodyWithTracking = htmlBody
            .Replace("{{TrackingPixel}}", $"<img src=\"https://yourapp.com/o/{trackingToken}.png\" width=\"1\" height=\"1\" />")
            .Replace("{{ClickLink}}", $"https://yourapp.com/t/{trackingToken}");

        message.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = bodyWithTracking };

        // Send via SMTP with OAuth2
        using var client = new SmtpClient();
        await client.ConnectAsync("smtp.office365.com", 587, SecureSocketOptions.StartTls);
        
        var oauth2 = new SaslMechanismOAuth2(tenant.SmtpFromAddress, result.AccessToken);
        await client.AuthenticateAsync(oauth2);
        
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
