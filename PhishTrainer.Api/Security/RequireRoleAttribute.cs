using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PhishTrainer.Api.Services;

namespace PhishTrainer.Api.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequireRoleAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _roles;

    public RequireRoleAttribute(params string[] roles)
    {
        _roles = roles;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var resolver = context.HttpContext.RequestServices.GetService<IRoleResolver>();
        if (resolver == null)
        {
            context.Result = new ForbidResult();
            return;
        }

        var role = await resolver.ResolveRoleAsync(context.HttpContext, context.HttpContext.RequestAborted);

        if (_roles.Length == 0 || _roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)))
            return;

        context.Result = new ForbidResult();
    }
}
