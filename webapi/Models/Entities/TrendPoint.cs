namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Monthly inventory / demand trend point used by the dashboard series. Persisted
/// to <c>inventory_trend</c> in PostgreSQL.
/// </summary>
public record TrendPoint(string Period, decimal InventoryValue, decimal OrderDemand);
