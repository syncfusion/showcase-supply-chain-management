namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Distribution centre / plant. Persisted to <c>warehouses</c> in PostgreSQL.
/// </summary>
public record Warehouse(
    string Id,
    string Name,
    string Code,
    string Region,
    string Country,
    string Type,
    double Latitude,
    double Longitude,
    decimal Utilization,
    decimal InventoryValue,
    int OpenOrders,
    int InboundShipments,
    int OutboundShipments,
    int Capacity);
