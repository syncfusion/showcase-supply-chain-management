using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="InventoryRecord"/> aggregate
/// (one stock-keeping row per product / warehouse / bin).
/// </summary>
public sealed class InventoryRecordConfiguration : IEntityTypeConfiguration<InventoryRecord>
{
    public void Configure(EntityTypeBuilder<InventoryRecord> builder)
    {
        builder.ToTable("inventory_records");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.ProductId)
            .HasColumnName("product_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Sku)
            .HasColumnName("sku")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.ProductName)
            .HasColumnName("product_name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Category)
            .HasColumnName("category")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.WarehouseId)
            .HasColumnName("warehouse_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.WarehouseName)
            .HasColumnName("warehouse_name")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Bin)
            .HasColumnName("bin")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Quantity)
            .HasColumnName("quantity")
            .IsRequired();
        builder.Property(x => x.Available)
            .HasColumnName("available")
            .IsRequired();
        builder.Property(x => x.Reserved)
            .HasColumnName("reserved")
            .IsRequired();
        builder.Property(x => x.SafetyStock)
            .HasColumnName("safety_stock")
            .IsRequired();
        builder.Property(x => x.ReorderPoint)
            .HasColumnName("reorder_point")
            .IsRequired();
        builder.Property(x => x.UnitCost)
            .HasColumnName("unit_cost")
            .HasColumnType("numeric(18,4)")
            .IsRequired();
        builder.Property(x => x.InventoryValue)
            .HasColumnName("inventory_value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.PreferredSupplierId)
            .HasColumnName("preferred_supplier_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.PreferredSupplierName)
            .HasColumnName("preferred_supplier_name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.LeadTimeDays)
            .HasColumnName("lead_time_days")
            .IsRequired();
        builder.Property(x => x.LastReplenishment)
            .HasColumnName("last_replenishment")
            .HasColumnType("date")
            .IsRequired();

        builder.HasIndex(x => x.Sku);
        builder.HasIndex(x => x.WarehouseId);
        builder.HasIndex(x => new { x.ProductId, x.WarehouseId }).IsUnique();
        builder.HasIndex(x => x.Status);
    }
}
