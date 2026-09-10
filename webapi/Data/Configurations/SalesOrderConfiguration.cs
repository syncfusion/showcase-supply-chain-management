using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="SalesOrder"/> aggregate.
/// </summary>
public sealed class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrder>
{
    public void Configure(EntityTypeBuilder<SalesOrder> builder)
    {
        builder.ToTable("sales_orders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Number)
            .HasColumnName("number")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.CustomerId)
            .HasColumnName("customer_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.CustomerName)
            .HasColumnName("customer_name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Region)
            .HasColumnName("region")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.OrderDate)
            .HasColumnName("order_date")
            .HasColumnType("date")
            .IsRequired();
        builder.Property(x => x.RequestedDate)
            .HasColumnName("requested_date")
            .HasColumnType("date")
            .IsRequired();
        builder.Property(x => x.Value)
            .HasColumnName("value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.WarehouseId)
            .HasColumnName("warehouse_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.WarehouseName)
            .HasColumnName("warehouse_name")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.FulfillmentPct)
            .HasColumnName("fulfillment_pct")
            .HasColumnType("numeric(5,2)")
            .IsRequired();
        builder.Property(x => x.ShipmentId)
            .HasColumnName("shipment_id")
            .HasMaxLength(32);
        builder.Property(x => x.Priority)
            .HasColumnName("priority")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Risk)
            .HasColumnName("risk")
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => x.Number).IsUnique();
        builder.HasIndex(x => x.CustomerId);
        builder.HasIndex(x => x.Region);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Risk);
    }
}
