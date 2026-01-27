using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Data;

public class PhishDbContext : DbContext
{
    private readonly ITenantResolver _tenantResolver;

    public PhishDbContext(DbContextOptions<PhishDbContext> options, ITenantResolver tenantResolver)
        : base(options)
    {
        _tenantResolver = tenantResolver;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<EmailTemplate> EmailTemplates { get; set; }
    public DbSet<LandingPageTemplate> LandingPages { get; set; }
    public DbSet<TargetGroup> TargetGroups { get; set; }
    public DbSet<TargetUser> TargetUsers { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<CampaignEvent> CampaignEvents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global query filter for multi-tenancy
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IMustHaveTenant).IsAssignableFrom(entityType.ClrType))
            {
                var tenantId = _tenantResolver.GetTenantId();
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(e => EF.Property<int>(e, "TenantId") == tenantId);
            }
        }

        // Indexes
        modelBuilder.Entity<Tenant>().HasIndex(t => t.Slug).IsUnique();
        modelBuilder.Entity<Campaign>().HasIndex(c => new { c.TenantId, c.Status });
        modelBuilder.Entity<CampaignEvent>().HasIndex(e => new { e.CampaignId, e.EventType });
    }
}
