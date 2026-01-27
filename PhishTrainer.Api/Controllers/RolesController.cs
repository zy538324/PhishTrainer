using Microsoft.AspNetCore.Mvc;
using PhishTrainer.Api.Models;

namespace PhishTrainer.Api.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    [HttpGet]
    public IActionResult GetRoles()
    {
        // No enforcement yet; this is only for visibility in the UI.
        return Ok(Roles.All);
    }
}
