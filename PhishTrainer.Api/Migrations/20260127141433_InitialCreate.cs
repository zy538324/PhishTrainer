using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PhishTrainer.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PrimaryColorHex = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SmtpDisplayName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    SmtpFromAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SmtpHost = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SmtpPort = table.Column<int>(type: "integer", nullable: true),
                    UseAzureAdSmtp = table.Column<bool>(type: "boolean", nullable: false),
                    AzureAdTenantId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AzureAdClientId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AzureAdClientSecret = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AzureAdDomain = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Subject = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    HtmlBody = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Difficulty = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TagsCsv = table.Column<string>(type: "text", nullable: true),
                    ImportedFrom = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LandingPages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    HtmlBody = table.Column<string>(type: "text", nullable: false),
                    RedirectUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CollectCredentials = table.Column<bool>(type: "boolean", nullable: false),
                    MaskCredentials = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LandingPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LandingPages_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TargetGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TargetGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TargetGroups_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Role = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExternalId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId1 = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId1",
                        column: x => x.TenantId1,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    EmailTemplateId = table.Column<int>(type: "integer", nullable: false),
                    LandingPageId = table.Column<int>(type: "integer", nullable: false),
                    TargetGroupId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ScheduledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LaunchedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ThrottlePerMinute = table.Column<int>(type: "integer", nullable: false),
                    FromDisplayNameOverride = table.Column<string>(type: "text", nullable: true),
                    ReplyToAddress = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Campaigns_EmailTemplates_EmailTemplateId",
                        column: x => x.EmailTemplateId,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Campaigns_LandingPages_LandingPageId",
                        column: x => x.LandingPageId,
                        principalTable: "LandingPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Campaigns_TargetGroups_TargetGroupId",
                        column: x => x.TargetGroupId,
                        principalTable: "TargetGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Campaigns_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TargetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    TargetGroupId = table.Column<int>(type: "integer", nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Department = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ManagerEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Location = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    RiskScore = table.Column<double>(type: "double precision", nullable: false),
                    IncidentCount = table.Column<int>(type: "integer", nullable: false),
                    LastIncidentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TargetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TargetUsers_TargetGroups_TargetGroupId",
                        column: x => x.TargetGroupId,
                        principalTable: "TargetGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TargetUsers_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    TargetUserId = table.Column<int>(type: "integer", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignEvents_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignEvents_TargetUsers_TargetUserId",
                        column: x => x.TargetUserId,
                        principalTable: "TargetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CampaignEvents_CampaignId",
                table: "CampaignEvents",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignEvents_TargetUserId",
                table: "CampaignEvents",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_EmailTemplateId",
                table: "Campaigns",
                column: "EmailTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_LandingPageId",
                table: "Campaigns",
                column: "LandingPageId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TargetGroupId",
                table: "Campaigns",
                column: "TargetGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TenantId",
                table: "Campaigns",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_TenantId",
                table: "EmailTemplates",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_LandingPages_TenantId",
                table: "LandingPages",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TargetGroups_TenantId",
                table: "TargetGroups",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TargetUsers_TargetGroupId",
                table: "TargetUsers",
                column: "TargetGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TargetUsers_TenantId_Email",
                table: "TargetUsers",
                columns: new[] { "TenantId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Slug",
                table: "Tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId1",
                table: "Users",
                column: "TenantId1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampaignEvents");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Campaigns");

            migrationBuilder.DropTable(
                name: "TargetUsers");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "LandingPages");

            migrationBuilder.DropTable(
                name: "TargetGroups");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
