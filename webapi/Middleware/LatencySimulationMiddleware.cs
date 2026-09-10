namespace Agm.SupplyChain.Api.Middleware;

public sealed class LatencySimulationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IConfiguration configuration)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/health", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var mode = context.Request.Headers["X-Network-Simulation"].FirstOrDefault()
                   ?? configuration["Demo:NetworkSimulation"]
                   ?? "Normal";

        if (string.Equals(mode, "Error", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Simulated network failure",
                mode
            });
            return;
        }

        var delayMs = mode switch
        {
            "300 ms" => 300,
            "800 ms" => 800,
            "1500 ms" => 1500,
            _ => 0
        };

        if (delayMs > 0)
            await Task.Delay(delayMs);

        await next(context);
    }
}
