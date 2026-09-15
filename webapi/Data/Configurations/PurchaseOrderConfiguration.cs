using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="PurchaseOrder"/> aggregate.
/// </summary>
public sealed class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        builder.ToTable("purchase_orders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Number)
            .HasColumnName("number")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.SupplierId)
            .HasColumnName("supplier_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.SupplierName)
            .HasColumnName("supplier_name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Plant)
            .HasColumnName("plant")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.CreatedDate)
            .HasColumnName("created_date")
            .HasColumnType("date")
            .IsRequired();
        builder.Property(x => x.RequiredDate)
            .HasColumnName("required_date")
            .HasColumnType("date")
            .IsRequired();
        builder.Property(x => x.Value)
            .HasColumnName("value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.Currency)
            .HasColumnName("currency")
            .HasMaxLength(8)
            .IsRequired();
        builder.Property(x => x.Buyer)
            .HasColumnName("buyer")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Items)
            .HasColumnName("items")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.DeliveryStatus)
            .HasColumnName("delivery_status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Risk)
            .HasColumnName("risk")
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => x.Number).IsUnique();
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Risk);
    }
}
