namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Inbound purchase order. Persisted to <c>purchase_orders</c> in PostgreSQL.
/// </summary>
public record PurchaseOrder(
    string Id,
    string Number,
    string SupplierId,
    string SupplierName,
    string Plant,
    DateOnly CreatedDate,
    DateOnly RequiredDate,
    decimal Value,
    string Currency,
    string Buyer,
    int Items,
    string Status,
    string DeliveryStatus,
    string Risk);
