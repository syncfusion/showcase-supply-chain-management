using Agm.SupplyChain.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace Agm.SupplyChain.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(
    IHostEnvironment env,
    IConfiguration config,
    InventoryAdjustmentStore adjustments) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Agm.SupplyChain.Api",
            environment = env.EnvironmentName,
            utc = DateTime.UtcNow,
            version = typeof(HealthController).Assembly.GetName().Version?.ToString() ?? "1.0.0",
            demo = new
            {
                networkSimulation = config["Demo:NetworkSimulation"] ?? "Normal",
                swagger = env.IsDevelopment() || string.Equals(config["Demo:EnableSwagger"], "true", StringComparison.OrdinalIgnoreCase),
                persistence = adjustments.Mode,
                overlayCount = adjustments.OverlayCount,
                sqlitePath = adjustments.DatabasePath
            }
        });
    }
}
