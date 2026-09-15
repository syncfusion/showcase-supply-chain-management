using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the catalog <see cref="Product"/> aggregate.
/// Maps the C# record's positional parameters to snake_case columns and declares
/// the indexes used by the catalog search / reorder queries.
/// </summary>
public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Sku)
            .HasColumnName("sku")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Category)
            .HasColumnName("category")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.PreferredSupplierId)
            .HasColumnName("preferred_supplier_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.UnitCost)
            .HasColumnName("unit_cost")
            .HasColumnType("numeric(18,4)")
            .IsRequired();
        builder.Property(x => x.LeadTimeDays)
            .HasColumnName("lead_time_days")
            .IsRequired();
        builder.Property(x => x.SafetyStock)
            .HasColumnName("safety_stock")
            .IsRequired();
        builder.Property(x => x.ReorderPoint)
            .HasColumnName("reorder_point")
            .IsRequired();

        builder.HasIndex(x => x.Sku).IsUnique();
        builder.HasIndex(x => x.Category);
        builder.HasIndex(x => x.PreferredSupplierId);
    }
}
