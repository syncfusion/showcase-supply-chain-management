using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="WarehouseLocationNode"/>
/// tree (warehouse / zone / aisle / bin).
/// </summary>
public sealed class WarehouseLocationNodeConfiguration : IEntityTypeConfiguration<WarehouseLocationNode>
{
    public void Configure(EntityTypeBuilder<WarehouseLocationNode> builder)
    {
        builder.ToTable("warehouse_locations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.ParentId)
            .HasColumnName("parent_id")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Level)
            .HasColumnName("level")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.WarehouseId)
            .HasColumnName("warehouse_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Capacity)
            .HasColumnName("capacity")
            .IsRequired();
        builder.Property(x => x.Quantity)
            .HasColumnName("quantity")
            .IsRequired();
        builder.Property(x => x.Utilization)
            .HasColumnName("utilization")
            .HasColumnType("numeric(5,2)")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => x.ParentId);
        builder.HasIndex(x => new { x.WarehouseId, x.Level });
    }
}
