using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AccountsGoalsJoinTableMigration2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountGoal_Accounts_LinkedAccountsId",
                table: "AccountGoal");

            migrationBuilder.DropForeignKey(
                name: "FK_AccountGoal_Goals_LinkedGoalsId",
                table: "AccountGoal");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AccountGoal",
                table: "AccountGoal");

            migrationBuilder.RenameTable(
                name: "AccountGoal",
                newName: "GoalAccounts");

            migrationBuilder.RenameIndex(
                name: "IX_AccountGoal_LinkedGoalsId",
                table: "GoalAccounts",
                newName: "IX_GoalAccounts_LinkedGoalsId");

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Goals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_GoalAccounts",
                table: "GoalAccounts",
                columns: new[] { "LinkedAccountsId", "LinkedGoalsId" });

            migrationBuilder.AddForeignKey(
                name: "FK_GoalAccounts_Accounts_LinkedAccountsId",
                table: "GoalAccounts",
                column: "LinkedAccountsId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GoalAccounts_Goals_LinkedGoalsId",
                table: "GoalAccounts",
                column: "LinkedGoalsId",
                principalTable: "Goals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoalAccounts_Accounts_LinkedAccountsId",
                table: "GoalAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_GoalAccounts_Goals_LinkedGoalsId",
                table: "GoalAccounts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_GoalAccounts",
                table: "GoalAccounts");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Goals");

            migrationBuilder.RenameTable(
                name: "GoalAccounts",
                newName: "AccountGoal");

            migrationBuilder.RenameIndex(
                name: "IX_GoalAccounts_LinkedGoalsId",
                table: "AccountGoal",
                newName: "IX_AccountGoal_LinkedGoalsId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AccountGoal",
                table: "AccountGoal",
                columns: new[] { "LinkedAccountsId", "LinkedGoalsId" });

            migrationBuilder.AddForeignKey(
                name: "FK_AccountGoal_Accounts_LinkedAccountsId",
                table: "AccountGoal",
                column: "LinkedAccountsId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AccountGoal_Goals_LinkedGoalsId",
                table: "AccountGoal",
                column: "LinkedGoalsId",
                principalTable: "Goals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
