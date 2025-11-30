using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Quizz.DataAccess;
using Quizz.Common.Services;
using Quizz.Common.Utilities;
using Quizz.Configuration;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Abstractions;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Configurations;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker.Http;

namespace Quizz.Functions
{
    // Deployment test - forcing redeploy with proper settings
    public class Program
    {
        public static void Main()
        {
            try
            {
                Console.WriteLine("========================================");
                Console.WriteLine($"[{DateTime.UtcNow}] Starting Quizz Function App...");
                Console.WriteLine($"Environment: {Environment.GetEnvironmentVariable("AZURE_FUNCTIONS_ENVIRONMENT")}");
                Console.WriteLine($"Worker Runtime: {Environment.GetEnvironmentVariable("FUNCTIONS_WORKER_RUNTIME")}");
                Console.WriteLine("========================================");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in startup logging: {ex.Message}");
            }

            var host = new HostBuilder()
                .ConfigureFunctionsWorkerDefaults(app =>
                {
                    // Add CORS middleware
                    app.UseMiddleware<CorsMiddleware>();
                })
                .ConfigureServices((context, services) =>
                {
                    try
                    {
                        Console.WriteLine($"[{DateTime.UtcNow}] Configuring services...");
                        
                        // Get configuration
                        var configuration = context.Configuration;
                        Console.WriteLine($"[{DateTime.UtcNow}] Configuration retrieved");
                        
                        var connectionString = configuration["Db__ConnectionString"] 
                            ?? Environment.GetEnvironmentVariable("Db__ConnectionString");

                        Console.WriteLine($"[{DateTime.UtcNow}] Connection string present: {!string.IsNullOrEmpty(connectionString)}");

                        if (string.IsNullOrEmpty(connectionString))
                        {
                            Console.WriteLine($"[{DateTime.UtcNow}] ERROR: Db__ConnectionString not found!");
                            throw new InvalidOperationException(
                                "Db__ConnectionString not found in configuration. " +
                                "Set it in local.settings.json or Azure App Settings.");
                        }

                        // Register application services
                        Console.WriteLine($"[{DateTime.UtcNow}] Registering DbService...");
                        services.AddDbService(connectionString);

                        // Register TokenService for JWT validation (token-only authorization)
                        Console.WriteLine($"[{DateTime.UtcNow}] Registering TokenService...");
                        var jwtSecret = configuration["Jwt:SecretKey"] 
                            ?? configuration["Jwt__SecretKey"]
                            ?? Environment.GetEnvironmentVariable("Jwt__SecretKey")
                            ?? throw new InvalidOperationException("JWT Secret not configured");
                        
                        var jwtIssuer = configuration["Jwt:Issuer"] 
                            ?? configuration["Jwt__Issuer"]
                            ?? Environment.GetEnvironmentVariable("Jwt__Issuer")
                            ?? "Quizz-API";
                        
                        var jwtAudience = configuration["Jwt:Audience"] 
                            ?? configuration["Jwt__Audience"]
                            ?? Environment.GetEnvironmentVariable("Jwt__Audience")
                            ?? "Quizz-Users";
                        
                        Console.WriteLine($"[{DateTime.UtcNow}] JWT Configuration - Issuer: {jwtIssuer}, Audience: {jwtAudience}, Secret Length: {jwtSecret.Length}");
                        services.AddSingleton(new TokenService(jwtSecret, jwtIssuer, jwtAudience));

                        // Register AuthorizationService for role-based authorization
                        Console.WriteLine($"[{DateTime.UtcNow}] Registering AuthorizationService...");
                        services.AddSingleton<AuthorizationService>();

                        Console.WriteLine($"[{DateTime.UtcNow}] Adding Application Insights...");
                        services.AddApplicationInsightsTelemetryWorkerService();
                        services.ConfigureFunctionsApplicationInsights();
                        
                        // Register OpenAPI configuration for Swagger
                        Console.WriteLine($"[{DateTime.UtcNow}] Registering OpenAPI configuration...");
                        services.AddSingleton<IOpenApiConfigurationOptions, OpenApiAuthConfiguration>();
                        
                        Console.WriteLine($"[{DateTime.UtcNow}] Service configuration completed successfully");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[{DateTime.UtcNow}] FATAL ERROR in ConfigureServices: {ex.GetType().Name}");
                        Console.WriteLine($"Message: {ex.Message}");
                        Console.WriteLine($"Stack: {ex.StackTrace}");
                        throw;
                    }
                })
                .Build();

            host.Run();
        }
    }

    // CORS Middleware for Azure Functions
    public class CorsMiddleware : IFunctionsWorkerMiddleware
    {
        public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
        {
            var requestData = await context.GetHttpRequestDataAsync();
            
            if (requestData != null)
            {
                // Handle OPTIONS preflight request
                if (requestData.Method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
                {
                    var response = requestData.CreateResponse(System.Net.HttpStatusCode.OK);
                    
                    // Add CORS headers
                    var origin = requestData.Headers.Contains("Origin") 
                        ? requestData.Headers.GetValues("Origin").FirstOrDefault() 
                        : "*";
                    
                    // Allow localhost and production domain
                    if (origin != null && (origin.StartsWith("http://localhost") || 
                        origin.Contains("azurestaticapps.net")))
                    {
                        response.Headers.Add("Access-Control-Allow-Origin", origin);
                    }
                    else
                    {
                        response.Headers.Add("Access-Control-Allow-Origin", "*");
                    }
                    
                    response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                    response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
                    response.Headers.Add("Access-Control-Allow-Credentials", "true");
                    response.Headers.Add("Access-Control-Max-Age", "86400");
                    
                    context.GetInvocationResult().Value = response;
                    return;
                }

                // Get the response for non-OPTIONS requests
                await next(context);

                // Add CORS headers to response
                var httpResponse = context.GetHttpResponseData();
                if (httpResponse != null)
                {
                    var origin = requestData.Headers.Contains("Origin") 
                        ? requestData.Headers.GetValues("Origin").FirstOrDefault() 
                        : "*";
                    
                    // Allow localhost and production domain
                    if (origin != null && (origin.StartsWith("http://localhost") || 
                        origin.Contains("azurestaticapps.net")))
                    {
                        httpResponse.Headers.Add("Access-Control-Allow-Origin", origin);
                    }
                    else
                    {
                        httpResponse.Headers.Add("Access-Control-Allow-Origin", "*");
                    }
                    
                    httpResponse.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                    httpResponse.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
                    httpResponse.Headers.Add("Access-Control-Allow-Credentials", "true");
                }
            }
            else
            {
                await next(context);
            }
        }
    }
}


