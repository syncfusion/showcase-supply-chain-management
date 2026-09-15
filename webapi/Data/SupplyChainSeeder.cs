using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Agm.SupplyChain.Api.Data;

/// <summary>
/// One-shot seeder that writes the deterministic in-memory dataset from
/// <see cref="SupplyChainStore"/> into the configured relational store
/// (Postgres or SQLite) on first run.
///
/// Idempotent: short-circuits if any of the seed tables already contain rows,
/// so repeated <c>dotnet run</c> won't duplicate data.
/// </summary>
public static class SupplyChainSeeder
{
    /// <summary>
    /// Seed every table exposed by <see cref="SupplyChainDbContext"/> from the
    /// matching in-memory list on <paramref name="store"/>. Runs in a single
    /// transaction so a partial failure rolls back cleanly.
    /// </summary>
    public static async Task SeedAsync(
        SupplyChainDbContext db,
        SupplyChainStore store,
        CancellationToken cancellationToken = default)
    {
        // Idempotency guard — bail out the moment we see any seeded row.
        // This makes the seeder safe to call on every startup.
        if (await db.Warehouses.AnyAsync(cancellationToken)
            || await db.Suppliers.AnyAsync(cancellationToken)
            || await db.Products.AnyAsync(cancellationToken))
        {
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        // Order matters for FK relationships:
        //   Warehouses / Suppliers / Customers  -> independent roots
        //   Products                            -> references Supplier
        //   InventoryRecords                    -> references Product + Warehouse + Supplier
        //   PurchaseOrders                      -> references Supplier + Warehouse
        //   SalesOrders                         -> references Customer + Warehouse
        //   Shipments                           -> references SalesOrder + Warehouse
        //   Exceptions / ProductionTasks / DockAppointments / WarehouseLocations
        //                                      -> reference Warehouses (and POs/SOs)
        //   InventoryTrend / PivotRows          -> independent denormalised views

        await db.Warehouses.AddRangeAsync(store.Warehouses, cancellationToken);
        await db.Suppliers.AddRangeAsync(store.Suppliers, cancellationToken);
        await db.Customers.AddRangeAsync(store.Customers, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await db.Products.AddRangeAsync(store.Products, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await db.InventoryRecords.AddRangeAsync(store.Inventory, cancellationToken);
        await db.PurchaseOrders.AddRangeAsync(store.PurchaseOrders, cancellationToken);
        await db.SalesOrders.AddRangeAsync(store.SalesOrders, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await db.Shipments.AddRangeAsync(store.Shipments, cancellationToken);
        await db.Exceptions.AddRangeAsync(store.Exceptions, cancellationToken);
        await db.ProductionTasks.AddRangeAsync(store.ProductionTasks, cancellationToken);
        await db.DockAppointments.AddRangeAsync(store.DockAppointments, cancellationToken);
        await db.WarehouseLocations.AddRangeAsync(store.WarehouseLocations, cancellationToken);
        await db.InventoryTrend.AddRangeAsync(store.InventoryTrend, cancellationToken);
        await db.PivotRows.AddRangeAsync(store.PivotRows, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }
}
