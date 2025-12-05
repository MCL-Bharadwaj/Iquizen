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

                // Check for existing in-progress attempt first
                var checkExistingAttemptSql = @"
                    SELECT attempt_id, started_at
                    FROM quiz.attempts
                    WHERE user_id = @user_id AND quiz_id = @quiz_id AND status = 'in_progress'
                    ORDER BY started_at DESC
                    LIMIT 1";

                using var existingAttemptReader = await _dbService.ExecuteQueryAsync(checkExistingAttemptSql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(request.UserId) },
                    new NpgsqlParameter("quiz_id", request.QuizId));

                if (await existingAttemptReader.ReadAsync())
                {
                    // Return existing in-progress attempt instead of creating a new one
                    var existingAttemptId = existingAttemptReader.GetGuid(0);
                    var existingStartedAt = existingAttemptReader.GetDateTime(1);
                    await existingAttemptReader.DisposeAsync();

                    _logger.LogInformation($"Found existing in-progress attempt {existingAttemptId} for user {request.UserId}, quiz {request.QuizId}");
                    
                    var existingAttempt = new Quizz.DataModel.Dtos.Attempt
                    {
                        AttemptId = existingAttemptId,
                        QuizId = request.QuizId,
                        UserId = request.UserId,
                        Status = "in_progress",
                        StartedAt = existingStartedAt,
                        CompletedAt = null,
                        TotalScore = null,
                        MaxPossibleScore = null,
                        ScorePercentage = null,
                        Metadata = null
                    };
                    
                    return await ResponseHelper.OkAsync(req, existingAttempt);
                }
                await existingAttemptReader.DisposeAsync();

                // Check if there's an assignment for this user and quiz, and enforce max_attempts
                // Only consider non-cancelled assignments (most recent one)
                var checkAssignmentSql = @"
                    SELECT assignment_id, max_attempts, attempts_used, status
                    FROM quiz.quiz_assignments
                    WHERE user_id = @user_id AND quiz_id = @quiz_id AND status != 'cancelled'
                    ORDER BY assigned_at DESC
                    LIMIT 1";

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
                // Only update non-cancelled assignments (most recent active one)
                var updateAssignmentSql = @"
                    UPDATE quiz.quiz_assignments
                    SET attempts_used = attempts_used + 1,
                        status = CASE 
                            WHEN status = 'assigned' THEN 'in_progress'
                            ELSE status
                        END,
                        started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
                    WHERE user_id = @user_id AND quiz_id = @quiz_id AND status != 'cancelled'
                    AND assignment_id = (SELECT assignment_id FROM quiz.quiz_assignments WHERE user_id = @user_id AND quiz_id = @quiz_id AND status != 'cancelled' ORDER BY assigned_at DESC LIMIT 1)";

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
                    SELECT a.attempt_id, a.quiz_id, a.user_id, a.status, a.started_at, a.completed_at,
                           a.total_score, a.max_possible_score, a.metadata, q.title as quiz_title,
                           qa.max_attempts, qa.attempts_used
                    FROM quiz.attempts a
                    LEFT JOIN quiz.quizzes q ON a.quiz_id = q.quiz_id
                    LEFT JOIN quiz.quiz_assignments qa ON a.quiz_id = qa.quiz_id AND a.user_id = qa.user_id
                    WHERE a.user_id = @user_id
                    ORDER BY a.started_at DESC";

                _logger.LogInformation($"Executing GetUserAttempts query for userId: {userId}");

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(userId) });

                _logger.LogInformation($"Query executed. HasRows: {reader.HasRows}");

                var attempts = new List<Quizz.DataModel.Dtos.Attempt>();
                while (await reader.ReadAsync())
                {
                    var metadataResult = reader.IsDBNull(8) ? null : reader.GetString(8);
                    var quizTitle = reader.IsDBNull(9) ? "Quiz" : reader.GetString(9);
                    var maxAttempts = reader.IsDBNull(10) ? (int?)null : reader.GetInt32(10);
                    var attemptsUsed = reader.IsDBNull(11) ? (int?)null : reader.GetInt32(11);
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
                        Metadata = metadataResult != null ? JsonSerializer.Deserialize<object>(metadataResult) : null,
                        QuizTitle = quizTitle,
                        MaxAttempts = maxAttempts,
                        AttemptsUsed = attemptsUsed
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

                // Calculate total score from responses
                var scoreSql = @"
                    SELECT COALESCE(SUM(points_earned), 0) as total_score
                    FROM quiz.responses
                    WHERE attempt_id = @attempt_id";

                decimal totalScore = 0;

                using (var scoreReader = await _dbService.ExecuteQueryAsync(scoreSql,
                    new NpgsqlParameter("attempt_id", guid)))
                {
                    if (await scoreReader.ReadAsync())
                    {
                        totalScore = scoreReader.GetDecimal(0);
                    }
                }

                // Calculate max possible score from the questions that were actually answered
                // Only sum points for questions that have responses in this attempt
                var maxScoreSql = @"
                    SELECT COALESCE(SUM(q.points), 0) as max_score,
                           COUNT(DISTINCT r.question_id) as question_count
                    FROM quiz.responses r
                    INNER JOIN quiz.questions q ON r.question_id = q.question_id
                    WHERE r.attempt_id = @attempt_id";

                decimal maxScore = 0;
                int questionCount = 0;

                using (var maxScoreReader = await _dbService.ExecuteQueryAsync(maxScoreSql,
                    new NpgsqlParameter("attempt_id", guid)))
                {
                    if (await maxScoreReader.ReadAsync())
                    {
                        maxScore = maxScoreReader.GetDecimal(0);
                        questionCount = maxScoreReader.GetInt32(1);
                        _logger.LogInformation($"Max score calculation: {questionCount} answered questions, total {maxScore} points possible");
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

                await reader.DisposeAsync();

                // Update assignment status to completed and store score if assignment exists
                // Only update non-cancelled assignments (most recent active one)
                var updateAssignmentSql = @"
                    UPDATE quiz.quiz_assignments
                    SET status = 'completed',
                        completed_at = CURRENT_TIMESTAMP,
                        score = @score_percentage
                    WHERE user_id = @user_id AND quiz_id = @quiz_id AND status != 'completed' AND status != 'cancelled'
                    AND assignment_id = (SELECT assignment_id FROM quiz.quiz_assignments WHERE user_id = @user_id AND quiz_id = @quiz_id AND status != 'cancelled' ORDER BY assigned_at DESC LIMIT 1)";

                await _dbService.ExecuteNonQueryAsync(updateAssignmentSql,
                    new NpgsqlParameter("user_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = Guid.Parse(attempt.UserId) },
                    new NpgsqlParameter("quiz_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = attempt.QuizId },
                    new NpgsqlParameter("score_percentage", scorePercentage));

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


