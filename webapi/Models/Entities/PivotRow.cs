namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// One row of the analytics pivot cube (Year x Month x Region x Warehouse x ...).
/// Persisted to <c>pivot_rows</c> in PostgreSQL.
/// </summary>
public record PivotRow(
    int Year,
    int Quarter,
    int Month,
    string Region,
    string Country,
    string Plant,
    string Warehouse,
    string Supplier,
    string Product,
    string ProductCategory,
    string Customer,
    string OrderStatus,
    decimal Revenue,
    int OrderQuantity,
    decimal InventoryValue,
    int LeadTime,
    decimal FreightCost,
    decimal PurchaseAmount,
    int DelayDays);
