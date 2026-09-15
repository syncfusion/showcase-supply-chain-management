using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="Shipment"/> aggregate.
/// </summary>
public sealed class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("shipments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.OrderId)
            .HasColumnName("order_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.OriginWarehouseId)
            .HasColumnName("origin_warehouse_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Destination)
            .HasColumnName("destination")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Mode)
            .HasColumnName("mode")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.OriginLat)
            .HasColumnName("origin_lat")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.OriginLng)
            .HasColumnName("origin_lng")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.CurrentLat)
            .HasColumnName("current_lat")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.CurrentLng)
            .HasColumnName("current_lng")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.DestLat)
            .HasColumnName("dest_lat")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.DestLng)
            .HasColumnName("dest_lng")
            .HasColumnType("double precision")
            .IsRequired();

        builder.HasIndex(x => x.OrderId);
        builder.HasIndex(x => x.Status);
    }
}
