using Agm.SupplyChain.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core table mapping for the persisted inventory-adjustment overlay rows
/// (the only currently-persisted entity in the project). Uses snake_case
/// column names so the Postgres schema matches conventional style.
/// </summary>
public sealed class InventoryAdjustmentRowConfiguration : IEntityTypeConfiguration<InventoryAdjustmentRow>
{
    public void Configure(EntityTypeBuilder<InventoryAdjustmentRow> builder)
    {
        builder.ToTable("inventory_adjustments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Quantity)
            .HasColumnName("quantity");
        builder.Property(x => x.Bin)
            .HasColumnName("bin")
            .HasMaxLength(32);
        builder.Property(x => x.SafetyStock)
            .HasColumnName("safety_stock");
        builder.Property(x => x.ReorderPoint)
            .HasColumnName("reorder_point");
        builder.Property(x => x.PreferredSupplierId)
            .HasColumnName("preferred_supplier_id")
            .HasMaxLength(64);
        builder.Property(x => x.UpdatedUtc)
            .HasColumnName("updated_utc")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
    }
}
