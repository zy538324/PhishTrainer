namespace PhishTrainer.Api.Models;

/// <summary>
/// Central RBAC role definitions. (Not enforced yet.)
/// </summary>
public static class Roles
{
    public const string MspAdmin = "MspAdmin";
    public const string TenantAdmin = "TenantAdmin";
    public const string Auditor = "Auditor";
    public const string Analyst = "Analyst";
    public const string Viewer = "Viewer";

    public static readonly IReadOnlyList<string> All = new[]
    {
        MspAdmin,
        TenantAdmin,
        Auditor,
        Analyst,
        Viewer
    };
}
