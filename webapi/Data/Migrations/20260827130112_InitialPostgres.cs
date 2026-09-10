using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agm.SupplyChain.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventory_adjustments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: true),
                    Bin = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    SafetyStock = table.Column<int>(type: "integer", nullable: true),
                    ReorderPoint = table.Column<int>(type: "integer", nullable: true),
                    PreferredSupplierId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_adjustments", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_adjustments");
        }
    }
}
