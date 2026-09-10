namespace Agm.SupplyChain.Api.Models.Entities;

/// <summary>
/// External supplier. Persisted to <c>suppliers</c> in PostgreSQL.
/// </summary>
public record Supplier(
    string Id,
    string Name,
    string Region,
    string Country,
    string Category,
    decimal AnnualSpend,
    int LeadTimeDays,
    decimal Otif,
    decimal QualityScore,
    string Risk,
    int OpenPos,
    string Status,
    double Latitude,
    double Longitude);
