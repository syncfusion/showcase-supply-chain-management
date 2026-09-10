using Agm.SupplyChain.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Agm.SupplyChain.Api.Data;

/// <summary>
/// Optional overlay for inventory batch adjustments.
/// Mode Memory: process lifetime only.
/// Mode Sqlite: persists overlays into a local SQLite database via EF Core.
/// Mode Postgres: persists overlays into the configured PostgreSQL database via EF Core / Npgsql.
/// </summary>
public sealed class InventoryAdjustmentStore
{
    private readonly object _gate = new();
    private readonly Dictionary<string, AdjustmentOverlay> _overlays = new(StringComparer.OrdinalIgnoreCase);
    private readonly SupplyChainDbContext? _db;
    private readonly ILogger<InventoryAdjustmentStore> _logger;

    public string Mode { get; }
    public string? DatabasePath { get; }
    public int OverlayCount
    {
        get { lock (_gate) return _overlays.Count; }
    }

    public InventoryAdjustmentStore(
        IConfiguration configuration,
        IHostEnvironment env,
        IServiceProvider services,
        ILogger<InventoryAdjustmentStore> logger)
    {
        _logger = logger;
        Mode = configuration["Demo:Persistence"] ?? "Memory";
        if (string.Equals(Mode, "Memory", StringComparison.OrdinalIgnoreCase))
            return;

        var connection = configuration.GetConnectionString("SupplyChainDataBase")
            ?? "Host=localhost;Database=agm_supplychain";
        var dbOptions = new DbContextOptionsBuilder<SupplyChainDbContext>();
        if (string.Equals(Mode, "Postgres", StringComparison.OrdinalIgnoreCase))
        {
            dbOptions.UseNpgsql(connection);
        }
        else if (string.Equals(Mode, "Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            var sqlitePath = configuration["Demo:SqlitePath"];
            if (string.IsNullOrWhiteSpace(sqlitePath))
                sqlitePath = Path.Combine(env.ContentRootPath, "data", "agm-adjustments.db");
            DatabasePath = sqlitePath;
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(DatabasePath))!);
            dbOptions.UseSqlite($"Data Source={sqlitePath}");
        }
        else
        {
            _logger.LogWarning("Demo:Persistence='{Mode}' is not a relational provider. Falling back to Memory.", Mode);
            Mode = "Memory";
            return;
        }

        _db = new SupplyChainDbContext(dbOptions.Options);
        EnsureSchema();
        Load();
        _logger.LogInformation("{Mode} inventory overlays loaded ({Count} rows)", Mode, OverlayCount);
    }

    public IReadOnlyList<AdjustmentOverlay> GetAll()
    {
        lock (_gate) return _overlays.Values.ToList();
    }

    public void Upsert(IEnumerable<AdjustmentOverlay> overlays)
    {
        var list = overlays.ToList();
        if (list.Count == 0) return;

        lock (_gate)
        {
            var stamp = DateTime.UtcNow;
            foreach (var overlay in list)
            {
                _overlays[overlay.Id] = overlay;
                if (_db is null) continue;

                var row = new InventoryAdjustmentRow
                {
                    Id = overlay.Id,
                    Quantity = overlay.Quantity,
                    Bin = overlay.Bin,
                    SafetyStock = overlay.SafetyStock,
                    ReorderPoint = overlay.ReorderPoint,
                    PreferredSupplierId = overlay.PreferredSupplierId,
                    UpdatedUtc = stamp
                };
                _db.InventoryAdjustments.Add(row);
            }
            if (_db is not null) _db.SaveChanges();
        }
    }

    private void EnsureSchema()
    {
        if (_db is null) return;
        try
        {
            _db.Database.EnsureCreated();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EnsureCreated failed; expecting migrations to have been applied.");
        }
    }

    private void Load()
    {
        if (_db is null) return;
        foreach (var row in _db.InventoryAdjustments.AsNoTracking())
        {
            _overlays[row.Id] = new AdjustmentOverlay(
                Id: row.Id,
                Quantity: row.Quantity,
                Bin: row.Bin,
                SafetyStock: row.SafetyStock,
                ReorderPoint: row.ReorderPoint,
                PreferredSupplierId: row.PreferredSupplierId);
        }
    }

    public sealed record AdjustmentOverlay(
        string Id,
        int? Quantity,
        string? Bin,
        int? SafetyStock,
        int? ReorderPoint,
        string? PreferredSupplierId);
}