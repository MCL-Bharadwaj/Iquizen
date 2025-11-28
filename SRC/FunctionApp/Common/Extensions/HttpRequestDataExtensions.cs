using System.Net;
using Microsoft.Azure.Functions.Worker.Http;
using System.Text.Json;

namespace Quizz.Common.Extensions;

/// <summary>
/// RFC 7807 ProblemDetails implementation for consistent error responses
/// </summary>
public class ProblemDetails
{
    public string Type { get; set; } = "about:blank";
    public string Title { get; set; } = default!;
    public int Status { get; set; }
    public string? Detail { get; set; }
    public string? Instance { get; set; }
    public Dictionary<string, object>? Extensions { get; set; }
}

/// <summary>
/// Extension methods for HttpRequestData to simplify response creation
/// </summary>
public static class HttpRequestDataExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    /// <summary>
    /// Creates a 200 OK response with JSON body
    /// </summary>
    public static async Task<HttpResponseData> OkAsync(this HttpRequestData req, object? data = null)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        if (data != null)
        {
            var json = JsonSerializer.Serialize(data, JsonOptions);
            await response.WriteStringAsync(json);
        }
        return response;
    }

    /// <summary>
    /// Creates a 200 OK response with JSON body (generic version)
    /// </summary>
    public static async Task<HttpResponseData> OkAsync<T>(this HttpRequestData req, T data)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        var json = JsonSerializer.Serialize(data, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 201 Created response with JSON body
    /// </summary>
    public static async Task<HttpResponseData> CreatedAsync(this HttpRequestData req, string location, object? data = null)
    {
        var response = req.CreateResponse(HttpStatusCode.Created);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Location", location);
        if (data != null)
        {
            var json = JsonSerializer.Serialize(data, JsonOptions);
            await response.WriteStringAsync(json);
        }
        return response;
    }

    /// <summary>
    /// Creates a 201 Created response with JSON body (generic version)
    /// </summary>
    public static async Task<HttpResponseData> CreatedAsync<T>(this HttpRequestData req, T data, string? location = null)
    {
        var response = req.CreateResponse(HttpStatusCode.Created);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        if (!string.IsNullOrEmpty(location))
        {
            response.Headers.Add("Location", location);
        }
        var json = JsonSerializer.Serialize(data, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 204 No Content response
    /// </summary>
    public static async Task<HttpResponseData> NoContentAsync(this HttpRequestData req)
    {
        return req.CreateResponse(HttpStatusCode.NoContent);
    }

    /// <summary>
    /// Creates a 400 Bad Request response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> BadRequestAsync(this HttpRequestData req, string detail, Dictionary<string, object>? errors = null)
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "Bad Request",
            Status = 400,
            Detail = detail,
            Instance = req.Url.AbsolutePath,
            Extensions = errors
        };

        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 401 Unauthorized response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> UnauthorizedAsync(this HttpRequestData req, string detail = "Authentication is required")
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
            Title = "Unauthorized",
            Status = 401,
            Detail = detail,
            Instance = req.Url.AbsolutePath
        };

        var response = req.CreateResponse(HttpStatusCode.Unauthorized);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 403 Forbidden response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> ForbiddenAsync(this HttpRequestData req, string detail = "You do not have permission to access this resource")
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
            Title = "Forbidden",
            Status = 403,
            Detail = detail,
            Instance = req.Url.AbsolutePath
        };

        var response = req.CreateResponse(HttpStatusCode.Forbidden);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 404 Not Found response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> NotFoundAsync(this HttpRequestData req, string detail)
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            Title = "Not Found",
            Status = 404,
            Detail = detail,
            Instance = req.Url.AbsolutePath
        };

        var response = req.CreateResponse(HttpStatusCode.NotFound);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 409 Conflict response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> ConflictAsync(this HttpRequestData req, string detail)
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            Title = "Conflict",
            Status = 409,
            Detail = detail,
            Instance = req.Url.AbsolutePath
        };

        var response = req.CreateResponse(HttpStatusCode.Conflict);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Creates a 500 Internal Server Error response with RFC 7807 ProblemDetails
    /// </summary>
    public static async Task<HttpResponseData> InternalServerErrorAsync(this HttpRequestData req, string detail = "An internal server error occurred")
    {
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "Internal Server Error",
            Status = 500,
            Detail = detail,
            Instance = req.Url.AbsolutePath
        };

        var response = req.CreateResponse(HttpStatusCode.InternalServerError);
        response.Headers.Add("Content-Type", "application/problem+json; charset=utf-8");
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await response.WriteStringAsync(json);
        return response;
    }

    /// <summary>
    /// Alias for InternalServerErrorAsync (shorter name for server errors)
    /// Creates a 500 Internal Server Error response
    /// </summary>
    public static async Task<HttpResponseData> ServerErrorAsync(this HttpRequestData req, string detail = "An internal server error occurred")
    {
        return await req.InternalServerErrorAsync(detail);
    }
}


