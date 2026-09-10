using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Agm.SupplyChain.Api.Data;

/// <summary>
/// Design-time factory so <c>dotnet ef migrations add ...</c> can construct a
/// <see cref="SupplyChainDbContext"/> outside <c>Program.cs</c>. Honours
/// <c>DEMO_PERSISTENCE</c> / <c>DEMO_POSTGRES_CONNECTION</c> environment
/// variables (matching the keys <c>Program.cs</c> reads) or, failing
/// that, falls back to the appsettings values.
/// </summary>
public sealed class SupplyChainDbContextFactory : IDesignTimeDbContextFactory<SupplyChainDbContext>
{
    public SupplyChainDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var mode = Environment.GetEnvironmentVariable("DEMO_PERSISTENCE")
            ?? configuration["Demo:Persistence"]
            ?? "Memory";

        var options = new DbContextOptionsBuilder<SupplyChainDbContext>();
        switch (mode.ToLowerInvariant())
        {
            case "postgres":
                var npg = Environment.GetEnvironmentVariable("DEMO_POSTGRES_CONNECTION")
                    ?? configuration.GetConnectionString("SupplyChainDataBase")
                    ?? throw new InvalidOperationException(
                        "Postgres mode requires Demo:PostgresConnection or ConnectionStrings:SupplyChainDataBase.");
                options.UseNpgsql(npg);
                break;
            case "sqlite":
                var sqlite = configuration["Demo:SqlitePath"] ?? "agm-adjustments.db";
                options.UseSqlite($"Data Source={sqlite}");
                break;
            default:
                throw new InvalidOperationException(
                    $"Design-time factory: Demo:Persistence='{mode}' is not a relational provider. " +
                    $"Set DEMO_PERSISTENCE=Postgres or DEMO_PERSISTENCE=Sqlite before running 'dotnet ef'.");
        }

        return new SupplyChainDbContext(options.Options);
    }
}