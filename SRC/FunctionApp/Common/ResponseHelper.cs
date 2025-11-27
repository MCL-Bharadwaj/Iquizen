using Microsoft.Azure.Functions.Worker.Http;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Helpers
{
    /// <summary>
    /// Helper methods for HTTP responses in Azure Functions.
    /// </summary>
    public static class ResponseHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        /// <summary>
        /// Creates a successful JSON response.
        /// </summary>
        public static async Task<HttpResponseData> OkAsync(HttpRequestData req, object data)
        {
            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(data, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 201 Created response with location header.
        /// </summary>
        public static async Task<HttpResponseData> CreatedAsync(HttpRequestData req, object data, string location)
        {
            var response = req.CreateResponse(HttpStatusCode.Created);
            response.Headers.Add("Content-Type", "application/json");
            response.Headers.Add("Location", location);
            await response.WriteStringAsync(JsonSerializer.Serialize(data, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 204 No Content response.
        /// </summary>
        public static Task<HttpResponseData> NoContentAsync(HttpRequestData req)
        {
            return Task.FromResult(req.CreateResponse(HttpStatusCode.NoContent));
        }

        /// <summary>
        /// Creates a 400 Bad Request response.
        /// </summary>
        public static async Task<HttpResponseData> BadRequestAsync(HttpRequestData req, string message, object? errors = null)
        {
            var response = req.CreateResponse(HttpStatusCode.BadRequest);
            response.Headers.Add("Content-Type", "application/json");
            
            var errorResponse = new
            {
                error = message,
                errors = errors
            };
            
            await response.WriteStringAsync(JsonSerializer.Serialize(errorResponse, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 404 Not Found response.
        /// </summary>
        public static async Task<HttpResponseData> NotFoundAsync(HttpRequestData req, string message = "Resource not found")
        {
            var response = req.CreateResponse(HttpStatusCode.NotFound);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(new { error = message }, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 500 Internal Server Error response.
        /// </summary>
        public static async Task<HttpResponseData> InternalServerErrorAsync(HttpRequestData req, string message = "An unexpected error occurred")
        {
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(new { error = message }, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 401 Unauthorized response.
        /// </summary>
        public static async Task<HttpResponseData> UnauthorizedAsync(HttpRequestData req, string message = "Unauthorized")
        {
            var response = req.CreateResponse(HttpStatusCode.Unauthorized);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(new { error = message }, JsonOptions));
            return response;
        }

        /// <summary>
        /// Creates a 429 Too Many Requests response.
        /// </summary>
        public static async Task<HttpResponseData> TooManyRequestsAsync(HttpRequestData req, string message = "Rate limit exceeded")
        {
            var response = req.CreateResponse(HttpStatusCode.TooManyRequests);
            response.Headers.Add("Content-Type", "application/json");
            response.Headers.Add("Retry-After", "3600"); // 1 hour
            await response.WriteStringAsync(JsonSerializer.Serialize(new { error = message }, JsonOptions));
            return response;
        }
    }
}


