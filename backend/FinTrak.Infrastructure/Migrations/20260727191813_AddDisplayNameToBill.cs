using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDisplayNameToBill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "Bills",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Backfill existing bills so they don't show a blank label until manually edited.
            migrationBuilder.Sql(@"UPDATE ""Bills"" SET ""DisplayName"" = ""Name"" WHERE ""DisplayName"" = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "Bills");
        }
    }
}
