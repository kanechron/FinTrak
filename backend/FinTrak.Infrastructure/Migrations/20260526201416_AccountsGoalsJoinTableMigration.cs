using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AccountsGoalsJoinTableMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "TargetAmount",
                table: "Goals",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.CreateTable(
                name: "AccountGoal",
                columns: table => new
                {
                    LinkedAccountsId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkedGoalsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountGoal", x => new { x.LinkedAccountsId, x.LinkedGoalsId });
                    table.ForeignKey(
                        name: "FK_AccountGoal_Accounts_LinkedAccountsId",
                        column: x => x.LinkedAccountsId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccountGoal_Goals_LinkedGoalsId",
                        column: x => x.LinkedGoalsId,
                        principalTable: "Goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountGoal_LinkedGoalsId",
                table: "AccountGoal",
                column: "LinkedGoalsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountGoal");

            migrationBuilder.AlterColumn<decimal>(
                name: "TargetAmount",
                table: "Goals",
                type: "numeric",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);
        }
    }
}
