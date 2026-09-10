namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Operational exception (low stock, late shipment, quality hold, ...). Persisted
/// to <c>exceptions</c> in PostgreSQL.
/// </summary>
public record ExceptionItem(
    string Id,
    string Type,
    string Severity,
    string Entity,
    string EntityId,
    string Description,
    string Region,
    string Warehouse,
    DateTime DetectedAt,
    string Status);
