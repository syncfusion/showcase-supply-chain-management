using Agm.SupplyChain.Api.Models;
using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Agm.SupplyChain.Api.Data;

/// <summary>
/// EF Core context that hosts the persisted entities for the supply-chain API.
/// Provider is selected at runtime based on <c>Demo:Persistence</c>:
/// <list type="bullet">
///   <item><description><c>Postgres</c> &mdash; <c>AddNpgsql</c> from <c>Npgsql.EntityFrameworkCore.PostgreSQL</c></description></item>
///   <item><description><c>Sqlite</c> &mdash; <c>AddSqlite</c> from <c>Microsoft.EntityFrameworkCore.Sqlite</c></description></item>
///   <item><description>anything else &mdash; not registered (memory mode only)</description></item>
/// </list>
/// Per-entity table + column mappings live in
/// <c>Data/Configurations/*.cs</c> (one <see cref="IEntityTypeConfiguration{T}"/>
/// per entity) and are auto-applied by
/// <see cref="ModelBuilder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly)"/>.
/// </summary>
public sealed class SupplyChainDbContext : DbContext
{
    public SupplyChainDbContext(DbContextOptions<SupplyChainDbContext> options) : base(options) { }

    // --- DbSets --------------------------------------------------------------
    public DbSet<InventoryAdjustmentRow> InventoryAdjustments => Set<InventoryAdjustmentRow>();

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<InventoryRecord> InventoryRecords => Set<InventoryRecord>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ExceptionItem> Exceptions => Set<ExceptionItem>();
    public DbSet<ProductionTask> ProductionTasks => Set<ProductionTask>();
    public DbSet<DockAppointment> DockAppointments => Set<DockAppointment>();
    public DbSet<WarehouseLocationNode> WarehouseLocations => Set<WarehouseLocationNode>();
    public DbSet<TrendPoint> InventoryTrend => Set<TrendPoint>();
    public DbSet<PivotRow> PivotRows => Set<PivotRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Pick up every IEntityTypeConfiguration<T> in the assembly so adding a
        // new entity + its configuration is the only change required to map it.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SupplyChainDbContext).Assembly);
    }
}