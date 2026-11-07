using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FilterRulePriorityIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rules_UserId_Target_Priority",
                table: "Rules");

            migrationBuilder.CreateIndex(
                name: "IX_Rules_UserId_Target_Priority",
                table: "Rules",
                columns: new[] { "UserId", "Target", "Priority" },
                unique: true,
                filter: "\"DeletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rules_UserId_Target_Priority",
                table: "Rules");

            migrationBuilder.CreateIndex(
                name: "IX_Rules_UserId_Target_Priority",
                table: "Rules",
                columns: new[] { "UserId", "Target", "Priority" },
                unique: true);
        }
    }
}
