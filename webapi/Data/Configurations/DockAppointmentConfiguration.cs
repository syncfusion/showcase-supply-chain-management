using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="DockAppointment"/> aggregate
/// (scheduled dock slots at a warehouse).
/// </summary>
public sealed class DockAppointmentConfiguration : IEntityTypeConfiguration<DockAppointment>
{
    public void Configure(EntityTypeBuilder<DockAppointment> builder)
    {
        builder.ToTable("dock_appointments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.WarehouseId)
            .HasColumnName("warehouse_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.DockId)
            .HasColumnName("dock_id")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.DockName)
            .HasColumnName("dock_name")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(x => x.Subject)
            .HasColumnName("subject")
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.StartTime)
            .HasColumnName("start_time")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(x => x.EndTime)
            .HasColumnName("end_time")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(x => x.Location)
            .HasColumnName("location")
            .HasMaxLength(128)
            .IsRequired();
        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(x => new { x.WarehouseId, x.StartTime });
        builder.HasIndex(x => x.Status);
    }
}
