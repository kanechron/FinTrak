using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InactivityTimeout = table.Column<int>(type: "integer", nullable: false),
                    TransactionPageSize = table.Column<int>(type: "integer", nullable: false),
                    AutoSync = table.Column<bool>(type: "boolean", nullable: false),
                    AutomaticReports = table.Column<int>(type: "integer", nullable: false),
                    AutoReportsFrequency = table.Column<int>(type: "integer", nullable: false),
                    AutoReportsMethod = table.Column<int>(type: "integer", nullable: false),
                    NotificationMethod = table.Column<int>(type: "integer", nullable: false),
                    NotificationType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Settings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Settings_UserId",
                table: "Settings",
                column: "UserId",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO "Settings" ("Id", "UserId", "CreatedAt", "DeletedAt", "InactivityTimeout", "TransactionPageSize", "AutoSync", "AutomaticReports", "AutoReportsFrequency", "AutoReportsMethod", "NotificationMethod", "NotificationType")
                    SELECT gen_random_uuid(), "Id", CURRENT_TIMESTAMP, null, 30, 50, false, 0, 0, 0, 0, 0 FROM "Users";
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Settings");
        }
    }
}
