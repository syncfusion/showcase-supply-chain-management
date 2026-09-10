namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Single stock-keeping record (one product in one warehouse bin). Persisted to
/// <c>inventory_records</c> in PostgreSQL.
/// </summary>
public record InventoryRecord(
    string Id,
    string ProductId,
    string Sku,
    string ProductName,
    string Category,
    string WarehouseId,
    string WarehouseName,
    string Bin,
    int Quantity,
    int Available,
    int Reserved,
    int SafetyStock,
    int ReorderPoint,
    decimal UnitCost,
    decimal InventoryValue,
    string Status,
    string PreferredSupplierId,
    string PreferredSupplierName,
    int LeadTimeDays,
    DateOnly LastReplenishment);
