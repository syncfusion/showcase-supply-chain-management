using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="ProductionTask"/> aggregate
/// (the Gantt nodes: plants, lines, work-orders, individual steps, milestones).
/// </summary>
public sealed class ProductionTaskConfiguration : IEntityTypeConfiguration<ProductionTask>
{
    public void Configure(EntityTypeBuilder<ProductionTask> builder)
    {
        builder.ToTable("production_tasks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.ParentId)
            .HasColumnName("parent_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.Plant)
            .HasColumnName("plant")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.ProductionLine)
            .HasColumnName("production_line")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.StartDate)
            .HasColumnName("start_date")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(x => x.EndDate)
            .HasColumnName("end_date")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(x => x.Progress)
            .HasColumnName("progress")
            .HasColumnType("numeric(5,2)")
            .IsRequired();
        builder.Property(x => x.Predecessor)
            .HasColumnName("predecessor")
            .HasMaxLength(32);
        builder.Property(x => x.Resource)
            .HasColumnName("resource")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.IsMilestone)
            .HasColumnName("is_milestone")
            .IsRequired();

        builder.HasIndex(x => x.ParentId);
        builder.HasIndex(x => x.Plant);
    }
}
