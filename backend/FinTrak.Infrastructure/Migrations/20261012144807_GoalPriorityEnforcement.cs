using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GoalPriorityEnforcement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                sql: """
                    UPDATE "Goals" AS g
                    SET "Priority" = r.rn::int
                    FROM (
                        SELECT "Id",
                            ROW_NUMBER() OVER (
                                PARTITION BY "UserId"
                                ORDER BY "Priority", "CreatedAt", "Id"
                            ) AS rn
                        FROM "Goals"
                        WHERE "DeletedAt" IS NULL
                    ) AS r
                    WHERE g."Id" = r."Id";

                """
            );
            migrationBuilder.CreateIndex(
                name: "IX_Goals_UserId_Priority",
                table: "Goals",
                columns: new[] { "UserId", "Priority" },
                unique: true,
                filter: "\"DeletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Goals_UserId_Priority",
                table: "Goals");
        }
    }
}
