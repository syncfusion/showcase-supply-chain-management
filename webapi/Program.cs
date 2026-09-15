using System.Text.Json;
using Agm.SupplyChain.Api.Data;
using Agm.SupplyChain.Api.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<SupplyChainStore>();
builder.Services.AddSingleton<InventoryAdjustmentStore>();

var persistence = (builder.Configuration["Demo:Persistence"] ?? "Memory").ToLowerInvariant();
var connectionString = builder.Configuration.GetConnectionString("SupplyChainDataBase");
if (persistence == "postgres" && !string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<SupplyChainDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else if (persistence == "sqlite")
{
    var sqlitePath = builder.Configuration["Demo:SqlitePath"];
    if (string.IsNullOrWhiteSpace(sqlitePath))
        sqlitePath = Path.Combine(builder.Environment.ContentRootPath, "data", "agm-adjustments.db");
    Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(sqlitePath))!);
    builder.Services.AddDbContext<SupplyChainDbContext>(options =>
        options.UseSqlite($"Data Source={sqlitePath}"));
}
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    var policySection = builder.Configuration.GetSection("Cors:Policies:AllowReactApp");
    var origins = policySection.GetSection("Origins").Get<string[]>() ?? System.Array.Empty<string>();

    options.AddPolicy("AllowReactApp", policy =>
    {
        if (origins.Length > 0)
        {
            policy.WithOrigins(origins);
        }
        else
        {
            throw new InvalidOperationException(
                   "Production CORS origins are not configured.");
        }

        if (policySection.GetValue<bool>("AllowAnyHeader", true))
        {
            policy.AllowAnyHeader();
        }

        if (policySection.GetValue<bool>("AllowAnyMethod", true))
        {
            policy.AllowAnyMethod();
        }

        if (policySection.GetValue<bool>("AllowCredentials", false))
        {
            policy.AllowCredentials();
        }
    });
});

var app = builder.Build();

// Run EF migrations (if a relational store is configured) before the dataset is warmed.
if (app.Environment.IsDevelopment())
{
    try
    {
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetService<SupplyChainDbContext>();
            if (db is not null)
            {
                await db.Database.MigrateAsync();

                // Seed the deterministic in-memory dataset into the relational
                // store on first run. The seeder is idempotent — it short-
                // circuits when the tables already contain rows.
                var seedStore = scope.ServiceProvider.GetRequiredService<SupplyChainStore>();
                await SupplyChainSeeder.SeedAsync(db, seedStore);
            }
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database migration failed. The API will continue running, but endpoints requiring persistence may fail until a database is available.");
    }
}

// Warm the deterministic dataset, then apply optional SQLite / memory overlays.
var store = app.Services.GetRequiredService<SupplyChainStore>();
var adjustments = app.Services.GetRequiredService<InventoryAdjustmentStore>();
store.ApplyOverlays(adjustments.GetAll());
if (adjustments.OverlayCount > 0)
    store.RebuildInventoryCaches();

var enableSwagger = app.Environment.IsDevelopment()
    || string.Equals(app.Configuration["Demo:EnableSwagger"], "true", StringComparison.OrdinalIgnoreCase);

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseStatusCodePages(async context =>

{

    var request = context.HttpContext.Request;

    var response = context.HttpContext.Response;


    if (response.StatusCode == 404)

    {

        if (request.Path.StartsWithSegments("/api"))

        {

            response.ContentType = "application/json";


            await response.WriteAsJsonAsync(new            {

                Status = 404,

                Message = "The requested API endpoint was not found."            });

        }

        else        {

            response.Redirect("/404.html");

        }

    }

});
var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var spaAvailable = Directory.Exists(wwwroot) && File.Exists(Path.Combine(wwwroot, "index.html"));
if (spaAvailable)
{
    // Inject Syncfusion license at runtime (Docker: SYNCFUSION_LICENSE env).
    var license = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE")
        ?? app.Configuration["Demo:SyncfusionLicense"]
        ?? "";
    var configJs = Path.Combine(wwwroot, "config.js");
    var payload = $"window.__AGM_CONFIG__={{syncfusionLicense:{JsonSerializer.Serialize(license)}}};";
    File.WriteAllText(configJs, payload);

    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseMiddleware<LatencySimulationMiddleware>();

app.MapControllers();
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        Status = "Healthy",
        Timestamp = DateTime.UtcNow,
        Environment = app.Environment.EnvironmentName,
        Version = "1.0.0"
    });
});
app.MapGet("/", async context =>
{
    context.Response.ContentType = "text/html";

    await context.Response.WriteAsync("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Portfolio API</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <style>

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Segoe UI, Arial, sans-serif;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: white;
            }

            .card {
                text-align: center;
                background: rgba(255,255,255,.06);
                padding: 50px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 40px rgba(0,0,0,.3);
                width: 90%;
                max-width: 700px;
            }

            h1 {
                font-size: 3rem;
                margin-bottom: 15px;
            }

            .status {
                color: #22c55e;
                font-weight: bold;
                margin: 20px 0;
            }

            .description {
                opacity: .85;
                line-height: 1.7;
            }

            .footer {
                margin-top: 30px;
                opacity: .7;
                font-size: .9rem;
            }

            .btn {
                display: inline-block;
                margin-top: 25px;
                padding: 12px 20px;
                border-radius: 8px;
                text-decoration: none;
                background: #2563eb;
                color: white;
            }

        </style>
    </head>

    <body>

        <div class="card">

            <h1>Portfolio API</h1>

            <p class="status">✅ Service Online</p>

            <p class="description">
                This backend API powers the application and is not intended
                for direct consumer interaction.
            </p>

            <a href="/health" class="btn">Health Check</a>

            <div class="footer">
                Copyright © 2001 - 2026 Syncfusion® , Inc. All Rights Reserved. | Trademarks
            </div>

        </div>

    </body>
    </html>
    """);
});
app.Run();
