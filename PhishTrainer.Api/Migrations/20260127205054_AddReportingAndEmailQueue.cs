using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhishTrainer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingAndEmailQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndUtc",
                table: "Campaigns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "Campaigns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceType",
                table: "Campaigns",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecurrenceEndUtc",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "RecurrenceType",
                table: "Campaigns");
        }
    }
}
