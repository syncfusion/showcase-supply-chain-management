namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// One node in the warehouse hierarchy (warehouse / zone / aisle / bin). Persisted
/// to <c>warehouse_locations</c> in PostgreSQL.
/// </summary>
public record WarehouseLocationNode(
    string Id,
    string ParentId,
    string Name,
    string Level,
    string WarehouseId,
    int Capacity,
    int Quantity,
    decimal Utilization,
    string Status);
