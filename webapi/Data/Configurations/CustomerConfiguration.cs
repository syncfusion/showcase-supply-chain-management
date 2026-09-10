using Agm.SupplyChain.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Agm.SupplyChain.Api.Data.Configurations;

/// <summary>
/// EF Core / Postgres table mapping for the <see cref="Customer"/> aggregate.
/// </summary>
public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
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

        builder.HasIndex(x => x.Region);
    }
}
