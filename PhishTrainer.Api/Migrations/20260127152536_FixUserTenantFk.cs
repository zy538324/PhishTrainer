using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhishTrainer.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixUserTenantFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId1",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId1",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenantId1",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId1",
                table: "Users",
                column: "TenantId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId1",
                table: "Users",
                column: "TenantId1",
                principalTable: "Tenants",
                principalColumn: "Id");
        }
    }
}
