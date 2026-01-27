using Microsoft.EntityFrameworkCore;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Services;

public class RoleResolver : IRoleResolver
{
    private readonly PhishDbContext _db;
    private readonly ITenantResolver _tenantResolver;

    public RoleResolver(PhishDbContext db, ITenantResolver tenantResolver)
    {
        _db = db;
        _tenantResolver = tenantResolver;
    }

    public async Task<string> ResolveRoleAsync(HttpContext context, CancellationToken ct = default)
    {
        // 1) Explicit header override
        var headerRole = context.Request.Headers["X-Role"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerRole))
            return headerRole.Trim();

        // 2) Resolve by user email within the tenant (if provided)
        var email = context.Request.Headers["X-User-Email"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(email))
        {
            try
            {
                var tenantId = _tenantResolver.GetTenantId();
                var user = await _db.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email.ToLower() == email.Trim().ToLower(), ct);
                if (user != null && !string.IsNullOrWhiteSpace(user.Role))
                    return user.Role;
            }
            catch (InvalidOperationException)
            {
                // Tenant not resolved (e.g., admin endpoints); ignore email-based role lookup.
            }
        }

        // 3) Default
        return Roles.TenantAdmin;
    }
}
