using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Goals",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Goals");
        }
    }
}
