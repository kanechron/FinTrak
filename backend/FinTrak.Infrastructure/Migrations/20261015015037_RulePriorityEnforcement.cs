using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RulePriorityEnforcement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rules_UserId_Target_Priority",
                table: "Rules"
            );

            // Renumber each user's active rules to 1..n per target, keeping their current order
            // (ties broken by CreatedAt, then Id, so the result is deterministic).
            migrationBuilder.Sql(
                """
                UPDATE "Rules" AS ru
                SET "Priority" = r.rn::int
                FROM (
                    SELECT "Id",
                        ROW_NUMBER() OVER (
                            PARTITION BY "UserId", "Target"
                            ORDER BY "Priority", "CreatedAt", "Id"
                        ) AS rn
                    FROM "Rules"
                    WHERE "DeletedAt" IS NULL
                ) AS r
                WHERE ru."Id" = r."Id";
                """
            );

            // Recreated exactly as FilterRulePriorityIndex defined it.
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

        }
    }
}
