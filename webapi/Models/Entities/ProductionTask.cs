namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Node in the production Gantt (plant, line, work-order, step, milestone). Persisted
/// to <c>production_tasks</c> in PostgreSQL.
/// </summary>
public record ProductionTask(
    string Id,
    string ParentId,
    string Name,
    string Plant,
    string ProductionLine,
    DateTime StartDate,
    DateTime EndDate,
    decimal Progress,
    string? Predecessor,
    string Resource,
    bool IsMilestone);
