using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;
using NpgsqlTypes;

using Quizz.Common.Services;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using Quizz.Functions.Helpers;
using System;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Quiz
{
    /// <summary>
    /// Write operations for quizzes (protected endpoints).
    /// POST, PUT, DELETE operations for managing quiz data.
    /// </summary>
    public class QuizWriteFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<QuizWriteFunctions> _logger;
        private readonly AuthorizationService _authService;

        public QuizWriteFunctions(
            IDbService dbService,
            ILogger<QuizWriteFunctions> logger,
            AuthorizationService authService)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        [Function("CreateQuiz")]
        [OpenApiOperation(
            operationId: "CreateQuiz",
            tags: new[] { "Quizzes - Write" },
            Summary = "Create a new quiz",
            Description = "Creates a new quiz.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(CreateQuizRequest),
            Required = true,
            Description = "Quiz creation request")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Quiz),
            Description = "Quiz successfully created")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.BadRequest,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Invalid request data")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Unauthorized,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "API key required or invalid")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.TooManyRequests,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Rate limit exceeded")]
        public async Task<HttpResponseData> CreateQuiz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "quizzes")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Tutors", "Content Creator", "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "quiz:write", stopwatch);
                // if (errorResponse != null)
                //     return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // For now, allow all requests (development mode)
                // Expected roles: content_creator, admin

                // Parse request body
                CreateQuizRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<CreateQuizRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Request body is required");
                }

                if (request == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Request body is required");
                }

                // Validate request body
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Title is required");
                }

                // Create quiz using raw SQL - match actual database schema
                var sql = @"
                    INSERT INTO quiz.quizzes (quiz_id, title, description, age_min, age_max, subject, 
                                       difficulty, estimated_minutes, tags, created_at, updated_at)
                    VALUES (@quiz_id, @title, @description, @age_min, @age_max, @subject,
                           @difficulty, @estimated_minutes, @tags, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING quiz_id, title, description, age_min, age_max, subject, 
                             difficulty, estimated_minutes, tags, created_at, updated_at";

                var quizId = Guid.NewGuid();
                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("quiz_id", quizId),
                    new NpgsqlParameter("title", request.Title),
                    new NpgsqlParameter("description", (object?)request.Description ?? DBNull.Value),
                    new NpgsqlParameter("age_min", (object?)request.AgeMin ?? DBNull.Value),
                    new NpgsqlParameter("age_max", (object?)request.AgeMax ?? DBNull.Value),
                    new NpgsqlParameter("subject", (object?)request.Subject ?? DBNull.Value),
                    new NpgsqlParameter("difficulty", (object?)request.Difficulty ?? DBNull.Value),
                    new NpgsqlParameter("estimated_minutes", (object?)request.EstimatedMinutes ?? DBNull.Value),
                    new NpgsqlParameter("tags", NpgsqlDbType.Array | NpgsqlDbType.Text) 
                    { 
                        Value = (object?)request.Tags ?? DBNull.Value 
                    });

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to create quiz");
                }

                var createdQuiz = new Quizz.DataModel.Dtos.Quiz
                {
                    QuizId = reader.GetGuid(0),
                    Title = reader.GetString(1),
                    Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                    AgeMin = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    AgeMax = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                    Subject = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Difficulty = reader.IsDBNull(6) ? null : reader.GetString(6),
                    EstimatedMinutes = reader.IsDBNull(7) ? null : reader.GetInt32(7),
                    Tags = reader.IsDBNull(8) ? null : (string[])reader.GetValue(8),
                    CreatedAt = reader.GetDateTime(9),
                    UpdatedAt = reader.GetDateTime(10)
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(
                //         req,
                //         _apiKeyService, 
                //         validation.ApiKey.ApiKeyId, 
                //         "CreateQuiz",
                //         201,
                //         stopwatch);
                // }

                _logger.LogInformation($"Created quiz {quizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, createdQuiz, $"/api/quizzes/{quizId}");
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                _logger.LogWarning(ex, "Unique constraint violation when creating quiz");
                return await ResponseHelper.BadRequestAsync(req, "A quiz with this data already exists");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating quiz");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to create quiz");
            }
        }

        [Function("UpdateQuiz")]
        [OpenApiOperation(
            operationId: "UpdateQuiz",
            tags: new[] { "Quizzes - Write" },
            Summary = "Update an existing quiz",
            Description = "Updates an existing quiz.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "quizId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "The unique identifier of the quiz")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(UpdateQuizRequest),
            Required = true,
            Description = "Quiz update request")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Quiz),
            Description = "Quiz successfully updated")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.BadRequest,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Invalid request data")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NotFound,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Quiz not found")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Unauthorized,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "API key required or invalid")]
        public async Task<HttpResponseData> UpdateQuiz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "quizzes/{quizId}")] HttpRequestData req,
            string quizId)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Content Creator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "quiz:write", stopwatch);
                // if (errorResponse != null)
                //     return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin

                // Validate quiz ID
                if (!Guid.TryParse(quizId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid quiz ID format");
                }

                // Parse request body
                UpdateQuizRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<UpdateQuizRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Request body is required");
                }

                if (request == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Request body is required");
                }

                // Validate request body
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Title is required");
                }

                // Update quiz using raw SQL - match actual database schema
                var sql = @"
                    UPDATE quiz.quizzes
                    SET title = @title,
                        description = @description,
                        age_min = @age_min,
                        age_max = @age_max,
                        subject = @subject,
                        difficulty = @difficulty,
                        estimated_minutes = @estimated_minutes,
                        tags = @tags,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE quiz_id = @quiz_id AND deleted_at IS NULL
                    RETURNING quiz_id, title, description, age_min, age_max, subject,
                             difficulty, estimated_minutes, tags, created_at, updated_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("quiz_id", guid),
                    new NpgsqlParameter("title", request.Title),
                    new NpgsqlParameter("description", (object?)request.Description ?? DBNull.Value),
                    new NpgsqlParameter("age_min", (object?)request.AgeMin ?? DBNull.Value),
                    new NpgsqlParameter("age_max", (object?)request.AgeMax ?? DBNull.Value),
                    new NpgsqlParameter("subject", (object?)request.Subject ?? DBNull.Value),
                    new NpgsqlParameter("difficulty", (object?)request.Difficulty ?? DBNull.Value),
                    new NpgsqlParameter("estimated_minutes", (object?)request.EstimatedMinutes ?? DBNull.Value),
                    new NpgsqlParameter("tags", NpgsqlDbType.Array | NpgsqlDbType.Text)
                    {
                        Value = (object?)request.Tags ?? DBNull.Value
                    });

                if (!await reader.ReadAsync())
                {
                    _logger.LogInformation($"Quiz not found: {quizId}");
                    return await ResponseHelper.NotFoundAsync(req, $"Quiz with ID '{quizId}' not found");
                }

                var updatedQuiz = new Quizz.DataModel.Dtos.Quiz
                {
                    QuizId = reader.GetGuid(0),
                    Title = reader.GetString(1),
                    Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                    AgeMin = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    AgeMax = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                    Subject = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Difficulty = reader.IsDBNull(6) ? null : reader.GetString(6),
                    EstimatedMinutes = reader.IsDBNull(7) ? null : reader.GetInt32(7),
                    Tags = reader.IsDBNull(8) ? null : (string[])reader.GetValue(8),
                    CreatedAt = reader.GetDateTime(9),
                    UpdatedAt = reader.GetDateTime(10)
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(
                //         req,
                //         _apiKeyService, 
                //         validation.ApiKey.ApiKeyId, 
                //         "UpdateQuiz",
                //         200,
                //         stopwatch);
                // }

                _logger.LogInformation($"Updated quiz {quizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, updatedQuiz);
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                _logger.LogWarning(ex, "Unique constraint violation when updating quiz");
                return await ResponseHelper.BadRequestAsync(req, "A quiz with this data already exists");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating quiz {quizId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to update quiz");
            }
        }

        [Function("DeleteQuiz")]
        [OpenApiOperation(
            operationId: "DeleteQuiz",
            tags: new[] { "Quizzes - Write" },
            Summary = "Delete a quiz",
            Description = "Soft deletes a quiz (sets deleted_at timestamp).")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "quizId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "The unique identifier of the quiz")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NoContent,
            contentType: "application/json",
            bodyType: typeof(void),
            Description = "Quiz successfully deleted")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NotFound,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Quiz not found")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Unauthorized,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "API key required or invalid")]
        public async Task<HttpResponseData> DeleteQuiz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "quizzes/{quizId}")] HttpRequestData req,
            string quizId)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Content Creator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "quiz:delete", stopwatch);
                // if (errorResponse != null)
                //     return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: admin only

                // Validate quiz ID
                if (!Guid.TryParse(quizId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid quiz ID format");
                }

                // Soft delete quiz
                var sql = @"
                    UPDATE quiz.quizzes
                    SET deleted_at = CURRENT_TIMESTAMP
                    WHERE quiz_id = @quiz_id AND deleted_at IS NULL";

                var rowsAffected = await _dbService.ExecuteNonQueryAsync(sql,
                    new Npgsql.NpgsqlParameter("@quiz_id", guid));

                if (rowsAffected == 0)
                {
                    _logger.LogInformation($"Quiz not found: {quizId}");
                    return await ResponseHelper.NotFoundAsync(req, $"Quiz with ID '{quizId}' not found");
                }

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(
                //         req,
                //         _apiKeyService, 
                //         validation.ApiKey.ApiKeyId, 
                //         "DeleteQuiz",
                //         204,
                //         stopwatch);
                // }

                _logger.LogInformation($"Deleted quiz {quizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.NoContentAsync(req);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting quiz {quizId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to delete quiz");
            }
        }
    }
}


