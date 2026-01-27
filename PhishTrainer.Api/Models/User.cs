namespace PhishTrainer.Api.Models;

public class User
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer"; // Admin, Viewer
    public Tenant Tenant { get; set; } = null!;
}
