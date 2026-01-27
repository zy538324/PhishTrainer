using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Middleware;
using PhishTrainer.Api.Services;
using PhishTrainer.Api.Services.BackgroundJobs;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();

// Caching
builder.Services.AddMemoryCache();

// DbContext (PostgreSQL)
builder.Services.AddDbContext<PhishDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    if (builder.Environment.IsDevelopment())
    {
        options.ConfigureWarnings(w =>
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
});

// Multi-tenancy + services
builder.Services.AddScoped<ITenantResolver, TenantResolver>();
builder.Services.AddScoped<IRoleResolver, RoleResolver>();
builder.Services.AddScoped<IMailService, MailService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddScoped<IEmailQueueService, EmailQueueService>();
builder.Services.AddHostedService<EmailQueueWorker>();
builder.Services.AddHttpClient();

// CORS (adjust origin(s) as needed)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins("http://0.0.0.0:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Ensure database is created/migrated and seed default tenant
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PhishDbContext>();
    db.Database.Migrate();

    if (!db.Tenants.IgnoreQueryFilters().Any(t => t.Slug == "default"))
    {
        db.Tenants.Add(new PhishTrainer.Api.Models.Tenant
        {
            Slug = "default",
            Name = "Default Tenant",
            IsActive = true
        });
        db.SaveChanges();
    }

    // Seed a default landing page per tenant if none exist
    var tenants = db.Tenants.IgnoreQueryFilters().ToList();
    foreach (var tenant in tenants)
    {
        var hasLanding = db.LandingPages.IgnoreQueryFilters().Any(l => l.TenantId == tenant.Id);
        if (!hasLanding)
        {
            db.LandingPages.Add(new PhishTrainer.Api.Models.LandingPageTemplate
            {
                TenantId = tenant.Id,
                Name = "Default Training Page",
                HtmlBody = "<html><body style='font-family:Arial,sans-serif;background:#f8fafc;padding:40px;'><div style='max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,0.08);'><h2>Security Awareness Training</h2><p>You have reached a simulated training page. No credentials were captured.</p><p>Close this page to continue.</p></div></body></html>",
                RedirectUrl = "https://example.com",
                CollectCredentials = false,
                MaskCredentials = true
            });
        }
    }

    db.SaveChanges();
}

// Development tools
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Order: HTTPS, CORS, tenant, auth, controllers[web:349][web:425][web:428]
app.UseHttpsRedirection();

app.UseCors();

app.UseMiddleware<TenantMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
