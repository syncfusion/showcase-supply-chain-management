using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the dashboard <see cref="TrendPoint"/>
/// monthly inventory / demand series.
/// </summary>
public sealed class TrendPointConfiguration : IEntityTypeConfiguration<TrendPoint>
{
    public void Configure(EntityTypeBuilder<TrendPoint> builder)
    {
        builder.ToTable("inventory_trend");
        // Period is the natural key (one row per month, format "yyyy-MM").
        builder.HasKey(x => x.Period);

        builder.Property(x => x.Period)
            .HasColumnName("period")
            .HasMaxLength(7)
            .IsRequired();
        builder.Property(x => x.InventoryValue)
            .HasColumnName("inventory_value")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.OrderDemand)
            .HasColumnName("order_demand")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
    }
}
