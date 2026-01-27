using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using PhishTrainer.Api.Data;
using PhishTrainer.Api.Middleware;
using PhishTrainer.Api.Services;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Caching
builder.Services.AddMemoryCache();

// DbContext (PostgreSQL)
builder.Services.AddDbContext<PhishDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Multi-tenancy + services
builder.Services.AddScoped<ITenantResolver, TenantResolver>();
builder.Services.AddScoped<IMailService, MailService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();

// CORS (adjust origin(s) as needed)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Development tools
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Order: HTTPS, CORS, tenant, auth, controllers[web:349][web:425][web:428]
app.UseHttpsRedirection();

app.UseCors();

app.UseMiddleware<TenantMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
