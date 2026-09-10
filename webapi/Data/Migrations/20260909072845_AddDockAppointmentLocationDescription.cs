using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Agm.SupplyChain.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDockAppointmentLocationDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "dock_appointments",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "location",
                table: "dock_appointments",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "description",
                table: "dock_appointments");

            migrationBuilder.DropColumn(
                name: "location",
                table: "dock_appointments");
        }
    }
}
