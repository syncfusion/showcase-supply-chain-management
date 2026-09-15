using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="ExceptionItem"/> aggregate.
/// </summary>
public sealed class ExceptionItemConfiguration : IEntityTypeConfiguration<ExceptionItem>
{
    public void Configure(EntityTypeBuilder<ExceptionItem> builder)
    {
        builder.ToTable("exceptions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Type)
            .HasColumnName("type")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Severity)
            .HasColumnName("severity")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.Entity)
            .HasColumnName("entity")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.EntityId)
            .HasColumnName("entity_id")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(512)
            .IsRequired();
        builder.Property(x => x.Region)
            .HasColumnName("region")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Warehouse)
            .HasColumnName("warehouse")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.DetectedAt)
            .HasColumnName("detected_at")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => x.Severity);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Region);
    }
}
