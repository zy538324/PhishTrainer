using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Models;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Data;

/// <summary>
/// Main EF Core DbContext for PhishTrainer.
/// Responsibilities:
/// - Expose DbSets for all entities.
/// - Apply global query filters for multi-tenancy.
/// - Enforce TenantId on all tenant-owned entities during SaveChanges.
/// </summary>
public class PhishDbContext : DbContext
{
    private readonly ITenantResolver _tenantResolver;

    public PhishDbContext(
        DbContextOptions<PhishDbContext> options,
        ITenantResolver tenantResolver)
        : base(options)
    {
        _tenantResolver = tenantResolver;
    }

    // DbSets
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<LandingPageTemplate> LandingPages => Set<LandingPageTemplate>();
    public DbSet<TargetGroup> TargetGroups => Set<TargetGroup>();
    public DbSet<TargetUser> TargetUsers => Set<TargetUser>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<CampaignEvent> CampaignEvents => Set<CampaignEvent>();
    public DbSet<EmailQueueItem> EmailQueue => Set<EmailQueueItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ApplyMultiTenantQueryFilters(modelBuilder);
        ConfigureIndexes(modelBuilder);
        ConfigureRelationships(modelBuilder);
    }

    /// <summary>
    /// Applies a global query filter for all entities implementing IMustHaveTenant.
    /// EF Core will automatically add "WHERE TenantId = CurrentTenant" to all queries.[web:71][web:110]
    /// </summary>
    private void ApplyMultiTenantQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IMustHaveTenant).IsAssignableFrom(entityType.ClrType))
            {
                var filter = BuildTenantFilterExpression(entityType.ClrType);
                entityType.SetQueryFilter(filter);
            }
        }
    }

    private LambdaExpression BuildTenantFilterExpression(Type clrType)
    {
        var parameter = Expression.Parameter(clrType, "e");
        var property = Expression.Property(parameter, nameof(IMustHaveTenant.TenantId));

        // Use a closure to read tenant id at query time
        var methodInfo = typeof(PhishDbContext)
            .GetMethod(nameof(GetCurrentTenantId), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;

        var currentTenantCall = Expression.Call(
            Expression.Constant(this),
            methodInfo);

        var equal = Expression.Equal(property, currentTenantCall);
        return Expression.Lambda(equal, parameter);
    }

    private int GetCurrentTenantId()
    {
        // Called from the query filter; throws if tenant not resolved
        return _tenantResolver.GetTenantId();
    }

    private static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.Slug)
            .IsUnique();

        modelBuilder.Entity<TargetUser>()
            .HasIndex(u => new { u.TenantId, u.Email })
            .IsUnique();
    }

    private static void ConfigureRelationships(ModelBuilder modelBuilder)
    {
        // Tenant
        modelBuilder.Entity<User>()
            .HasOne(u => u.Tenant)
            .WithMany(t => t.Users)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EmailTemplate>()
            .HasOne(e => e.Tenant)
            .WithMany()
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LandingPageTemplate>()
            .HasOne(l => l.Tenant)
            .WithMany()
            .HasForeignKey(l => l.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TargetGroup>()
            .HasOne(g => g.Tenant)
            .WithMany()
            .HasForeignKey(g => g.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TargetUser>()
            .HasOne(t => t.Tenant)
            .WithMany()
            .HasForeignKey(t => t.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TargetUser>()
            .HasOne(t => t.Group)
            .WithMany(g => g.Targets)
            .HasForeignKey(t => t.TargetGroupId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Campaign>()
            .HasOne(c => c.Tenant)
            .WithMany()
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Campaign>()
            .HasOne(c => c.EmailTemplate)
            .WithMany()
            .HasForeignKey(c => c.EmailTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Campaign>()
            .HasOne(c => c.EmailTemplateB)
            .WithMany()
            .HasForeignKey(c => c.EmailTemplateBId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Campaign>()
            .HasOne(c => c.LandingPage)
            .WithMany()
            .HasForeignKey(c => c.LandingPageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Campaign>()
            .HasOne(c => c.TargetGroup)
            .WithMany()
            .HasForeignKey(c => c.TargetGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CampaignEvent>()
            .HasOne(e => e.Campaign)
            .WithMany(c => c.Events)
            .HasForeignKey(e => e.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CampaignEvent>()
            .HasOne(e => e.TargetUser)
            .WithMany()
            .HasForeignKey(e => e.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    // ---------- Multi-tenant SaveChanges enforcement ----------

    public override int SaveChanges()
    {
        EnforceTenantIds();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceTenantIds();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceTenantIds();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        EnforceTenantIds();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// Ensures that all IMustHaveTenant entities have their TenantId set to the current tenant.
    /// Prevents cross-tenant data leaks and orphan rows.[web:79][web:106][web:109]
    /// </summary>
    private void EnforceTenantIds()
    {
        // Only resolve tenant if we are actually saving tenant-owned entities
        var hasTenantEntities = ChangeTracker.Entries()
            .Any(e => e.Entity is IMustHaveTenant);

        if (!hasTenantEntities)
            return;

        int tenantId;
        try
        {
            tenantId = _tenantResolver.GetTenantId();
        }
        catch (InvalidOperationException)
        {
            // Tenant not resolved (startup seeding or background tasks)
            return;
        }

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is IMustHaveTenant tenantEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        // Always stamp new entities with current tenant
                        tenantEntity.TenantId = tenantId;
                        break;

                    case EntityState.Modified:
                    case EntityState.Deleted:
                        // Guard against someone trying to tamper with TenantId
                        if (tenantEntity.TenantId != tenantId)
                        {
                            throw new InvalidOperationException(
                                $"Cross-tenant data access detected. Entity type {entry.Entity.GetType().Name} " +
                                $"has TenantId={tenantEntity.TenantId}, but current tenant is {tenantId}.");
                        }
                        break;
                }
            }
        }
    }
}
