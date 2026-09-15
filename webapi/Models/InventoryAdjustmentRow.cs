namespace Agm.SupplyChain.Api.Models;

/// <summary>
/// Persisted overlay for an inventory row (batch adjustment, bin re-assignment, supplier swap, etc.).
/// Mirrors the SQLite <c>inventory_adjustments</c> table that <see cref="Data.InventoryAdjustmentStore"/>
/// used to materialise directly.
/// </summary>
public sealed class InventoryAdjustmentRow
{
    public string Id { get; set; } = default!;
    public int? Quantity { get; set; }
    public string? Bin { get; set; }
    public int? SafetyStock { get; set; }
    public int? ReorderPoint { get; set; }
    public string? PreferredSupplierId { get; set; }
    public DateTime UpdatedUtc { get; set; }
}