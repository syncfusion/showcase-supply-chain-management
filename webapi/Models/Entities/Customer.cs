namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// Customer account. Persisted to <c>customers</c> in PostgreSQL.
/// </summary>
public record Customer(
    string Id,
    string Name,
    string Region,
    string Country);
