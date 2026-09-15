namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Scheduled dock slot at a warehouse. Persisted to <c>dock_appointments</c> in PostgreSQL.
/// </summary>
public record DockAppointment(
    string Id,
    string WarehouseId,
    string DockId,
    string DockName,
    string Subject,
    string EventType,
    DateTime StartTime,
    DateTime EndTime,
    string Status,
    string Location,
    string Description);
