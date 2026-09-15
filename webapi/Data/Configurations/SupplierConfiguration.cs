using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="Supplier"/> aggregate.
/// </summary>
public sealed class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Region)
            .HasColumnName("region")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Country)
            .HasColumnName("country")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Category)
            .HasColumnName("category")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.AnnualSpend)
            .HasColumnName("annual_spend")
            .HasColumnType("numeric(18,2)")
            .IsRequired();
        builder.Property(x => x.LeadTimeDays)
            .HasColumnName("lead_time_days")
            .IsRequired();
        builder.Property(x => x.Otif)
            .HasColumnName("otif")
            .HasColumnType("numeric(5,3)")
            .IsRequired();
        builder.Property(x => x.QualityScore)
            .HasColumnName("quality_score")
            .HasColumnType("numeric(5,3)")
            .IsRequired();
        builder.Property(x => x.Risk)
            .HasColumnName("risk")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.OpenPos)
            .HasColumnName("open_pos")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.Latitude)
            .HasColumnName("latitude")
            .HasColumnType("double precision")
            .IsRequired();
        builder.Property(x => x.Longitude)
            .HasColumnName("longitude")
            .HasColumnType("double precision")
            .IsRequired();

        builder.HasIndex(x => x.Region);
        builder.HasIndex(x => x.Risk);
        builder.HasIndex(x => x.Category);
    }
}
