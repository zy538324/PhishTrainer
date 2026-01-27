namespace PhishTrainer.Api.Services;

public interface IRoleResolver
{
    Task<string> ResolveRoleAsync(HttpContext context, CancellationToken ct = default);
}
