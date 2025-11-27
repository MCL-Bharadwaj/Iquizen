using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Abstractions;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Configurations;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;

namespace Quizz.Configuration;

/// <summary>
/// Adds JWT Bearer token authentication to OpenAPI/Swagger documentation
/// This allows users to click "Authorize" button and enter their JWT token
/// </summary>
public class OpenApiAuthConfiguration : DefaultOpenApiConfigurationOptions
{
    public override OpenApiInfo Info { get; set; } = new OpenApiInfo
    {
        Version = "v1",
        Title = "LMS API",
        Description = "Learning Management System API with JWT Bearer authentication. Click 'Authorize' 🔒 button to add your JWT token.",
        Contact = new OpenApiContact
        {
            Name = "LMS Development Team",
            Email = "support@lms.com"
        }
    };

    public override OpenApiVersionType OpenApiVersion { get; set; } = OpenApiVersionType.V3;

    public override List<OpenApiServer> Servers { get; set; } = new List<OpenApiServer>
    {
        new OpenApiServer { Url = "http://localhost:7071", Description = "Local Development" },
        new OpenApiServer { Url = "https://your-app.azurewebsites.net", Description = "Production" }
    };
}


