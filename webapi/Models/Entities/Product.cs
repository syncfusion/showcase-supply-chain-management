namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Catalog product. Persisted to <c>products</c> in PostgreSQL.
/// </summary>
public record Product(
    string Id,
    string Sku,
    string Name,
    string Category,
    string PreferredSupplierId,
    decimal UnitCost,
    int LeadTimeDays,
    int SafetyStock,
    int ReorderPoint);
