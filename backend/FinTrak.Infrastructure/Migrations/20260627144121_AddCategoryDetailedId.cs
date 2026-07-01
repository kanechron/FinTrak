using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrak.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryDetailedId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryDetailed",
                table: "Transactions");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryDetailedId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DetailId",
                table: "Categories",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_CategoryDetailedId",
                table: "Transactions",
                column: "CategoryDetailedId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_DetailId",
                table: "Categories",
                column: "DetailId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categories_Categories_DetailId",
                table: "Categories",
                column: "DetailId",
                principalTable: "Categories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryDetailedId",
                table: "Transactions",
                column: "CategoryDetailedId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Categories_DetailId",
                table: "Categories");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryDetailedId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_CategoryDetailedId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Categories_DetailId",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "CategoryDetailedId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "DetailId",
                table: "Categories");

            migrationBuilder.AddColumn<string>(
                name: "CategoryDetailed",
                table: "Transactions",
                type: "text",
                nullable: true);
        }
    }
}
