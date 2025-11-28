using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;
using NpgsqlTypes;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using Quizz.Functions.Helpers;
using Quizz.Common.Services;
using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Quiz
{
    /// <summary>
    /// Read-only quiz operations (public endpoints - no API key required).
    /// GET operations for retrieving quiz data.
    /// </summary>
    public class QuizReadFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<QuizReadFunctions> _logger;
        private readonly AuthorizationService _authService;

        public QuizReadFunctions(
            IDbService dbService,
            ILogger<QuizReadFunctions> logger,
            AuthorizationService authService)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        [Function("GetQuizzes")]
        [OpenApiOperation(
            operationId: "GetQuizzes",
            tags: new[] { "Quizzes - Read" },
            Summary = "Get all published quizzes",
            Description = "Retrieves a paginated list of published quizzes with optional filtering by difficulty and tags. No API key required.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "difficulty",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Filter by difficulty level (easy, medium, hard)")]
        [OpenApiParameter(
            name: "tags",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Filter by tags (comma-separated)")]
        [OpenApiParameter(
            name: "limit",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(int),
            Description = "Maximum number of results (default: 50, max: 100)")]
        [OpenApiParameter(
            name: "offset",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(int),
            Description = "Offset for pagination (default: 0)")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved list of quizzes")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.BadRequest,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Invalid query parameters")]
        public async Task<HttpResponseData> GetQuizzes(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "quizzes")] HttpRequestData req)
        {
            // Validate JWT token - allow admin, student, tutor, content creator, player
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Parse query parameters
                var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
                var difficulty = query["difficulty"];
                var tagsParam = query["tags"];
                var limit = int.TryParse(query["limit"], out var l) ? Math.Min(l, 100) : 50;
                var offset = int.TryParse(query["offset"], out var o) ? Math.Max(o, 0) : 0;

                // Parse tags if provided
                string[]? tags = null;
                if (!string.IsNullOrWhiteSpace(tagsParam))
                {
                    tags = tagsParam.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(t => t.Trim())
                        .ToArray();
                }

                // Get quizzes from database - use raw query since GetPublishedQuizzesAsync doesn't match schema
                var sql = @"
                    SELECT quiz_id, title, description, age_min, age_max, subject, difficulty, 
                           estimated_minutes, tags, created_at, updated_at
                    FROM quiz.quizzes
                    WHERE deleted_at IS NULL";

                var parameters = new System.Collections.Generic.List<Npgsql.NpgsqlParameter>();

                if (!string.IsNullOrWhiteSpace(difficulty))
                {
                    sql += " AND difficulty = @difficulty";
                    parameters.Add(new Npgsql.NpgsqlParameter("@difficulty", difficulty));
                }

                if (tags != null && tags.Length > 0)
                {
                    sql += " AND tags && @tags";
                    parameters.Add(new NpgsqlParameter("tags", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = tags });
                }

                sql += " ORDER BY created_at DESC LIMIT @limit OFFSET @offset";
                parameters.Add(new Npgsql.NpgsqlParameter("@limit", limit));
                parameters.Add(new Npgsql.NpgsqlParameter("@offset", offset));

                using var reader = await _dbService.ExecuteQueryAsync(sql, parameters.ToArray());

                var quizzes = new System.Collections.Generic.List<Quizz.DataModel.Dtos.Quiz>();
                while (await reader.ReadAsync())
                {
                    quizzes.Add(new Quizz.DataModel.Dtos.Quiz
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
                    });
                }

                var response = new
                {
                    data = quizzes,
                    count = quizzes.Count,
                    limit = limit,
                    offset = offset
                };

                _logger.LogInformation(
                    $"Retrieved {quizzes.Count} quizzes (difficulty={difficulty}, tags={tagsParam}, limit={limit}, offset={offset}) in {stopwatch.ElapsedMilliseconds}ms");

                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quizzes");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve quizzes");
            }
        }

        [Function("GetQuizById")]
        [OpenApiOperation(
            operationId: "GetQuizById",
            tags: new[] { "Quizzes - Read" },
            Summary = "Get quiz by ID",
            Description = "Retrieves detailed information about a specific quiz including metadata and all questions. No API key required.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "quizId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid),
            Description = "The unique identifier of the quiz")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(QuizWithQuestions),
            Description = "Successfully retrieved quiz details")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NotFound,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Quiz not found")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.BadRequest,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Invalid quiz ID format")]
        public async Task<HttpResponseData> GetQuizById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "quizzes/{quizId}")] HttpRequestData req,
            string quizId)
        {
            // Validate JWT token - allow admin, student, tutor, content creator, player
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Student", "Tutors", "Content Creator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(quizId, out var guid))
                {
                    _logger.LogWarning($"Invalid quiz ID format: {quizId}");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid quiz ID format. Expected a valid GUID.");
                }

                var sql = @"
                    SELECT quiz_id, title, description, age_min, age_max, subject, difficulty,
                           estimated_minutes, tags, created_at, updated_at
                    FROM quiz.quizzes
                    WHERE quiz_id = @quiz_id AND deleted_at IS NULL";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new Npgsql.NpgsqlParameter("@quiz_id", guid));

                if (!await reader.ReadAsync())
                {
                    _logger.LogInformation($"Quiz not found: {quizId}");
                    return await ResponseHelper.NotFoundAsync(req, $"Quiz with ID '{quizId}' not found");
                }

                var quiz = new Quizz.DataModel.Dtos.Quiz
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

                _logger.LogInformation($"Retrieved quiz {quizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, quiz);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving quiz {quizId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve quiz");
            }
        }


    }
}


