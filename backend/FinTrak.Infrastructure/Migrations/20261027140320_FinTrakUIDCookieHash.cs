using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FinTrakUIDCookieHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "DeviceTokenHash",
                table: "RefreshTokens",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.Sql("""
                DELETE FROM "RefreshTokens"
            """);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_DeviceTokenHash",
                table: "RefreshTokens",
                column: "DeviceTokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_DeviceTokenHash",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "DeviceTokenHash",
                table: "RefreshTokens");
        }
    }
}
