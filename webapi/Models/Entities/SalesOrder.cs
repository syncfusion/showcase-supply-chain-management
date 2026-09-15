namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Outbound sales order. Persisted to <c>sales_orders</c> in PostgreSQL.
/// </summary>
public record SalesOrder(
    string Id,
    string Number,
    string CustomerId,
    string CustomerName,
    string Region,
    DateOnly OrderDate,
    DateOnly RequestedDate,
    decimal Value,
    string WarehouseId,
    string WarehouseName,
    decimal FulfillmentPct,
    string ShipmentId,
    string Priority,
    string Status,
    string Risk);
