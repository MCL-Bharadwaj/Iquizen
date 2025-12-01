using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using Quizz.Functions.Helpers;
using Quizz.Common.Services;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Attempt
{
    public class AttemptFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<AttemptFunctions> _logger;
        private readonly AuthorizationService _authService;

        public AttemptFunctions(
            IDbService dbService,
            ILogger<AttemptFunctions> logger,
            AuthorizationService authService)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        [Function("StartAttempt")]
        [OpenApiOperation(
            operationId: "StartAttempt",
            tags: new[] { "Attempts" },
            Summary = "Start a new quiz attempt",
            Description = "Creates a new attempt for a quiz.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(StartAttemptRequest),
            Required = true)]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Attempt),
            Description = "Attempt started successfully")]
        public async Task<HttpResponseData> StartAttempt(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "attempts")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Player", "Tutors");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: player (own attempts), admin

                StartAttemptRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<StartAttemptRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null || string.IsNullOrWhiteSpace(request.UserId) || request.QuizId == Guid.Empty)
                {
                    return await ResponseHelper.BadRequestAsync(req, "UserId and QuizId are required");
                }

                // Check if there's an assignment for this user and quiz, and enforce max_attempts
                var checkAssignmentSql = @"
                    SELECT assignment_id, max_attempts, attempts_used, status
                    FROM quiz.quiz_assignments
                    WHERE user_id = @user_id AND quiz_id = @quiz_id";

                using var assignmentReader = await _dbService.ExecuteQueryAsync(checkAssignmentSql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(request.UserId) },
                    new NpgsqlParameter("quiz_id", request.QuizId));

                if (await assignmentReader.ReadAsync())
                {
                    // Assignment exists - enforce limits
                    var assignmentStatus = assignmentReader.GetString(assignmentReader.GetOrdinal("status"));
                    var maxAttempts = assignmentReader.IsDBNull(assignmentReader.GetOrdinal("max_attempts")) 
                        ? (int?)null 
                        : assignmentReader.GetInt32(assignmentReader.GetOrdinal("max_attempts"));
                    var attemptsUsed = assignmentReader.GetInt32(assignmentReader.GetOrdinal("attempts_used"));

                    await assignmentReader.DisposeAsync();

                    // Check if assignment is cancelled
                    if (assignmentStatus == "cancelled")
                    {
                        return await ResponseHelper.BadRequestAsync(req, "This assignment has been cancelled");
                    }

                    // Check max attempts limit
                    if (maxAttempts.HasValue && attemptsUsed >= maxAttempts.Value)
                    {
                        return await ResponseHelper.BadRequestAsync(req, 
                            $"Maximum attempts ({maxAttempts.Value}) reached for this assignment");
                    }
                }
                else
                {
                    await assignmentReader.DisposeAsync();
                }

                var attemptId = Guid.NewGuid();
                var metadataJson = request.Metadata != null ? JsonSerializer.Serialize(request.Metadata) : null;

                var sql = @"
                    INSERT INTO quiz.attempts (attempt_id, quiz_id, user_id, status, started_at, metadata)
                    VALUES (@attempt_id, @quiz_id, @user_id, 'in_progress', CURRENT_TIMESTAMP, @metadata::jsonb)
                    RETURNING attempt_id, quiz_id, user_id, status, started_at, completed_at,
                              total_score, max_possible_score, score_percentage, metadata";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("attempt_id", attemptId),
                    new NpgsqlParameter("quiz_id", request.QuizId),
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(request.UserId) },
                    new NpgsqlParameter("metadata", (object?)metadataJson ?? DBNull.Value));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to start attempt");
                }

                var metadataResult = reader.IsDBNull(9) ? null : reader.GetString(9);
                var attempt = new Quizz.DataModel.Dtos.Attempt
                {
                    AttemptId = reader.GetGuid(0),
                    QuizId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2).ToString(),
                    Status = reader.GetString(3),
                    StartedAt = reader.GetDateTime(4),
                    CompletedAt = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
                    TotalScore = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                    MaxPossibleScore = reader.IsDBNull(7) ? null : reader.GetDecimal(7),
                    ScorePercentage = reader.IsDBNull(8) ? null : reader.GetDecimal(8),
                    Metadata = metadataResult != null ? JsonSerializer.Deserialize<object>(metadataResult) : null
                };

                await reader.DisposeAsync();

                // Update assignment attempts_used counter if assignment exists
                var updateAssignmentSql = @"
                    UPDATE quiz.quiz_assignments
                    SET attempts_used = attempts_used + 1,
                        status = CASE 
                            WHEN status = 'assigned' THEN 'in_progress'
                            ELSE status
                        END,
                        started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
                    WHERE user_id = @user_id AND quiz_id = @quiz_id";

                await _dbService.ExecuteNonQueryAsync(updateAssignmentSql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(request.UserId) },
                    new NpgsqlParameter("quiz_id", request.QuizId));

                _logger.LogInformation($"Started attempt {attemptId} for quiz {request.QuizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, attempt, $"/api/attempts/{attemptId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting attempt");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to start attempt");
            }
        }

        [Function("GetAttemptById")]
        [OpenApiOperation(
            operationId: "GetAttemptById",
            tags: new[] { "Attempts" },
            Summary = "Get attempt by ID",
            Description = "Retrieves attempt details.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "attemptId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid))]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Attempt),
            Description = "Successfully retrieved attempt")]
        public async Task<HttpResponseData> GetAttemptById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "attempts/{attemptId}")] HttpRequestData req,
            string attemptId)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Player", "Tutors");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(attemptId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid attempt ID format");
                }

                var sql = @"
                    SELECT attempt_id, quiz_id, user_id, status, started_at, completed_at,
                           total_score, max_possible_score, metadata
                    FROM quiz.attempts
                    WHERE attempt_id = @attempt_id";

                _logger.LogInformation($"Executing query: {sql}");
                _logger.LogInformation($"Parameter: attempt_id = {guid}");

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("attempt_id", guid));

                _logger.LogInformation($"Query executed. HasRows: {reader.HasRows}");

                if (!await reader.ReadAsync())
                {
                    _logger.LogWarning($"Attempt with ID '{attemptId}' not found in database");
                    return await ResponseHelper.NotFoundAsync(req, $"Attempt with ID '{attemptId}' not found");
                }

                // Read values
                decimal? totalScore = reader.IsDBNull(6) ? (decimal?)null : reader.GetDecimal(6);
                decimal? maxScore = reader.IsDBNull(7) ? (decimal?)null : reader.GetDecimal(7);
                var metadataResult = reader.IsDBNull(8) ? null : reader.GetString(8);
                
                // Calculate score percentage if both scores are available
                decimal? scorePercentage = null;
                if (totalScore.HasValue && maxScore.HasValue && maxScore.Value > 0)
                {
                    scorePercentage = (totalScore.Value / maxScore.Value) * 100;
                }

                var attempt = new Quizz.DataModel.Dtos.Attempt
                {
                    AttemptId = reader.GetGuid(0),
                    QuizId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2).ToString(),
                    Status = reader.GetString(3),
                    StartedAt = reader.GetDateTime(4),
                    CompletedAt = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
                    TotalScore = totalScore,
                    MaxPossibleScore = maxScore,
                    ScorePercentage = scorePercentage,
                    Metadata = metadataResult != null ? JsonSerializer.Deserialize<object>(metadataResult) : null
                };

                _logger.LogInformation($"Retrieved attempt {attemptId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving attempt {attemptId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve attempt");
            }
        }

        [Function("GetUserAttempts")]
        [OpenApiOperation(
            operationId: "GetUserAttempts",
            tags: new[] { "Attempts" },
            Summary = "Get all attempts by user",
            Description = "Retrieves all attempts for a specific user.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "userId",
            In = ParameterLocation.Query,
            Required = true,
            Type = typeof(string))]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved user attempts")]
        public async Task<HttpResponseData> GetUserAttempts(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "attempts")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Player", "Tutors");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
                var userId = query["userId"];

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return await ResponseHelper.BadRequestAsync(req, "userId query parameter is required");
                }

                var sql = @"
                    SELECT attempt_id, quiz_id, user_id, status, started_at, completed_at,
                           total_score, max_possible_score, metadata
                    FROM quiz.attempts
                    WHERE user_id = @user_id
                    ORDER BY started_at DESC";

                _logger.LogInformation($"Executing GetUserAttempts query for userId: {userId}");

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(userId) });

                _logger.LogInformation($"Query executed. HasRows: {reader.HasRows}");

                var attempts = new List<Quizz.DataModel.Dtos.Attempt>();
                while (await reader.ReadAsync())
                {
                    var metadataResult = reader.IsDBNull(8) ? null : reader.GetString(8);
                    decimal? totalScore = reader.IsDBNull(6) ? (decimal?)null : reader.GetDecimal(6);
                    decimal? maxScore = reader.IsDBNull(7) ? (decimal?)null : reader.GetDecimal(7);
                    decimal? scorePercentage = null;
                    if (totalScore.HasValue && maxScore.HasValue && maxScore.Value > 0)
                    {
                        scorePercentage = (totalScore.Value / maxScore.Value) * 100;
                    }

                    attempts.Add(new Quizz.DataModel.Dtos.Attempt
                    {
                        AttemptId = reader.GetGuid(0),
                        QuizId = reader.GetGuid(1),
                        UserId = reader.GetGuid(2).ToString(),
                        Status = reader.GetString(3),
                        StartedAt = reader.GetDateTime(4),
                        CompletedAt = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
                        TotalScore = totalScore,
                        MaxPossibleScore = maxScore,
                        ScorePercentage = scorePercentage,
                        Metadata = metadataResult != null ? JsonSerializer.Deserialize<object>(metadataResult) : null
                    });
                }

                var response = new
                {
                    userId,
                    attempts,
                    count = attempts.Count
                };

                _logger.LogInformation($"Retrieved {attempts.Count} attempts for user {userId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user attempts");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve attempts");
            }
        }

        [Function("CompleteAttempt")]
        [OpenApiOperation(
            operationId: "CompleteAttempt",
            tags: new[] { "Attempts" },
            Summary = "Complete an attempt",
            Description = "Marks a quiz attempt as completed and calculates the final score.")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiParameter(
            name: "attemptId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid))]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Attempt),
            Description = "Attempt completed successfully")]
        public async Task<HttpResponseData> CompleteAttempt(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "attempts/{attemptId}/complete")] HttpRequestData req,
            string attemptId)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Player", "Tutors");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: player (own attempts), admin

                if (!Guid.TryParse(attemptId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid attempt ID format");
                }

                // Calculate scores from responses
                var scoreSql = @"
                    SELECT 
                        COALESCE(SUM(points_earned), 0) as total_score,
                        COALESCE(SUM(points_possible), 0) as max_score
                    FROM quiz.responses
                    WHERE attempt_id = @attempt_id";

                decimal totalScore = 0;
                decimal maxScore = 0;

                using (var scoreReader = await _dbService.ExecuteQueryAsync(scoreSql,
                    new NpgsqlParameter("attempt_id", guid)))
                {
                    if (await scoreReader.ReadAsync())
                    {
                        totalScore = scoreReader.GetDecimal(0);
                        maxScore = scoreReader.GetDecimal(1);
                    }
                }

                var scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

                _logger.LogInformation($"Attempting to complete attempt {attemptId}: totalScore={totalScore}, maxScore={maxScore}, scorePercentage={scorePercentage}");

                // Update attempt
                var sql = @"
                    UPDATE quiz.attempts
                    SET status = 'completed',
                        completed_at = CURRENT_TIMESTAMP,
                        total_score = @total_score,
                        max_possible_score = @max_score,
                        score_percentage = @score_percentage
                    WHERE attempt_id = @attempt_id AND status = 'in_progress'
                    RETURNING attempt_id, quiz_id, user_id, status, started_at, completed_at,
                              total_score, max_possible_score, score_percentage, metadata";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("attempt_id", guid),
                    new NpgsqlParameter("total_score", totalScore),
                    new NpgsqlParameter("max_score", maxScore),
                    new NpgsqlParameter("score_percentage", scorePercentage));

                if (!await reader.ReadAsync())
                {
                    _logger.LogError($"Failed to update attempt {attemptId}. Either not found or already completed.");
                    return await ResponseHelper.NotFoundAsync(req, $"Attempt with ID '{attemptId}' not found or already completed");
                }

                var metadataResult = reader.IsDBNull(9) ? null : reader.GetString(9);
                var attempt = new Quizz.DataModel.Dtos.Attempt
                {
                    AttemptId = reader.GetGuid(0),
                    QuizId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2).ToString(),
                    Status = reader.GetString(3),
                    StartedAt = reader.GetDateTime(4),
                    CompletedAt = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
                    TotalScore = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                    MaxPossibleScore = reader.IsDBNull(7) ? null : reader.GetDecimal(7),
                    ScorePercentage = reader.IsDBNull(8) ? null : reader.GetDecimal(8),
                    Metadata = metadataResult != null ? JsonSerializer.Deserialize<object>(metadataResult) : null
                };

                _logger.LogInformation($"Completed attempt {attemptId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error completing attempt {attemptId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to complete attempt");
            }
        }
    }
}


