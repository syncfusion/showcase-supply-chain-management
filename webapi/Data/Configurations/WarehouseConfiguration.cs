using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="Warehouse"/> aggregate.
/// </summary>
public sealed class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("warehouses");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Code)
            .HasColumnName("code")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.Region)
            .HasColumnName("region")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Country)
            .HasColumnName("country")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Type)
            .HasColumnName("type")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Latitude)
            .HasColumnName("latitude")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.Longitude)
            .HasColumnName("longitude")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.Utilization)
            .HasColumnName("utilization")
            .HasColumnType("numeric(5,2)")
            .IsRequired();
        builder.Property(x => x.InventoryValue)
            .HasColumnName("inventory_value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.OpenOrders)
            .HasColumnName("open_orders")
            .IsRequired();
        builder.Property(x => x.InboundShipments)
            .HasColumnName("inbound_shipments")
            .IsRequired();
        builder.Property(x => x.OutboundShipments)
            .HasColumnName("outbound_shipments")
            .IsRequired();
        builder.Property(x => x.Capacity)
            .HasColumnName("capacity")
            .IsRequired();

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.Region);
    }
}
