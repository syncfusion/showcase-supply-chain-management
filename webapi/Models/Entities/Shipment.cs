namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// In-flight shipment. Persisted to <c>shipments</c> in PostgreSQL.
/// </summary>
public record Shipment(
    string Id,
    string OrderId,
    string OriginWarehouseId,
    string Destination,
    string Status,
    string Mode,
    double OriginLat,
    double OriginLng,
    double CurrentLat,
    double CurrentLng,
    double DestLat,
    double DestLng);
