using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="PivotRow"/> analytics cube.
/// </summary>
public sealed class PivotRowConfiguration : IEntityTypeConfiguration<PivotRow>
{
    public void Configure(EntityTypeBuilder<PivotRow> builder)
    {
        builder.ToTable("pivot_rows");
        // Composite surrogate key — pivot rows are dimension combinations, not
        // uniquely identifiable from a single column. EF requires a key, so we
        // pick a stable unique tuple that callers can also use as a row locator.
        builder.HasKey(x => new { x.Year, x.Month, x.Region, x.Warehouse, x.Product });

        builder.Property(x => x.Year)
            .HasColumnName("year")
            .IsRequired();
        builder.Property(x => x.Quarter)
            .HasColumnName("quarter")
            .IsRequired();
        builder.Property(x => x.Month)
            .HasColumnName("month")
            .IsRequired();
        builder.Property(x => x.Region)
            .HasColumnName("region")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Country)
            .HasColumnName("country")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Plant)
            .HasColumnName("plant")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Warehouse)
            .HasColumnName("warehouse")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Supplier)
            .HasColumnName("supplier")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Product)
            .HasColumnName("product")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.ProductCategory)
            .HasColumnName("product_category")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Customer)
            .HasColumnName("customer")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.OrderStatus)
            .HasColumnName("order_status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Revenue)
            .HasColumnName("revenue")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.OrderQuantity)
            .HasColumnName("order_quantity")
            .IsRequired();
        builder.Property(x => x.InventoryValue)
            .HasColumnName("inventory_value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.LeadTime)
            .HasColumnName("lead_time")
            .IsRequired();
        builder.Property(x => x.FreightCost)
            .HasColumnName("freight_cost")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.PurchaseAmount)
            .HasColumnName("purchase_amount")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.DelayDays)
            .HasColumnName("delay_days")
            .IsRequired();

        builder.HasIndex(x => new { x.Year, x.Month });
        builder.HasIndex(x => x.Region);
    }
}
