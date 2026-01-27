using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhishTrainer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignAbSplit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AbSplitPercent",
                table: "Campaigns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EmailTemplateBId",
                table: "Campaigns",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_EmailTemplateBId",
                table: "Campaigns",
                column: "EmailTemplateBId");

            migrationBuilder.AddForeignKey(
                name: "FK_Campaigns_EmailTemplates_EmailTemplateBId",
                table: "Campaigns",
                column: "EmailTemplateBId",
                principalTable: "EmailTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Campaigns_EmailTemplates_EmailTemplateBId",
                table: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_Campaigns_EmailTemplateBId",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "AbSplitPercent",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "EmailTemplateBId",
                table: "Campaigns");
        }
    }
}
