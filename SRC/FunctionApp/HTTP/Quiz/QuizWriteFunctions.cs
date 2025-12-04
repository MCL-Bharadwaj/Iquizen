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

        [Function("BatchImportQuiz")]
        [OpenApiOperation(
            operationId: "BatchImportQuiz",
            tags: new[] { "Quizzes - Write" },
            Summary = "Batch import quiz with questions",
            Description = "Creates a quiz and associates questions (reuses existing questions by ID, creates new ones without ID).")]
        [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(BatchImportRequest),
            Required = true,
            Description = "Batch import request with quiz and questions")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(QuizWithQuestions),
            Description = "Quiz and questions successfully imported")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.BadRequest,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Invalid request data")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Unauthorized,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Unauthorized")]
        public async Task<HttpResponseData> BatchImportQuiz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "quizzes/batch")] HttpRequestData req)
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Tutors", "Content Creator", "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Parse request body
                BatchImportRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<BatchImportRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null || request.Quiz == null || request.Questions == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Quiz and questions are required");
                }

                if (string.IsNullOrWhiteSpace(request.Quiz.Title))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Quiz title is required");
                }

                if (request.Questions.Count == 0)
                {
                    return await ResponseHelper.BadRequestAsync(req, "At least one question is required");
                }

                var quizId = Guid.NewGuid();
                var questionMappings = new List<(Guid questionId, int position)>();

                // Step 1: Create the quiz
                var createQuizSql = @"
                    INSERT INTO quiz.quizzes (quiz_id, title, description, age_min, age_max, subject, 
                                       difficulty, estimated_minutes, tags, created_at, updated_at)
                    VALUES (@quiz_id, @title, @description, @age_min, @age_max, @subject,
                           @difficulty, @estimated_minutes, @tags, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING quiz_id, title, description, age_min, age_max, subject, 
                             difficulty, estimated_minutes, tags, created_at, updated_at";

                using (var reader = await _dbService.ExecuteQueryAsync(createQuizSql,
                    new NpgsqlParameter("quiz_id", quizId),
                    new NpgsqlParameter("title", request.Quiz.Title),
                    new NpgsqlParameter("description", (object?)request.Quiz.Description ?? DBNull.Value),
                    new NpgsqlParameter("age_min", (object?)request.Quiz.AgeMin ?? DBNull.Value),
                    new NpgsqlParameter("age_max", (object?)request.Quiz.AgeMax ?? DBNull.Value),
                    new NpgsqlParameter("subject", (object?)request.Quiz.Subject ?? DBNull.Value),
                    new NpgsqlParameter("difficulty", (object?)request.Quiz.Difficulty ?? DBNull.Value),
                    new NpgsqlParameter("estimated_minutes", (object?)request.Quiz.EstimatedMinutes ?? DBNull.Value),
                    new NpgsqlParameter("tags", NpgsqlDbType.Array | NpgsqlDbType.Text)
                    {
                        Value = (object?)request.Quiz.Tags ?? DBNull.Value
                    }))
                {
                    if (!await reader.ReadAsync())
                    {
                        return await ResponseHelper.InternalServerErrorAsync(req, "Failed to create quiz");
                    }
                }

                // Step 2: Process questions
                int position = 1;
                foreach (var question in request.Questions)
                {
                    Guid questionId;

                    // Check if questionId is provided and exists
                    if (question.QuestionId.HasValue)
                    {
                        bool questionExists = false;
                        var checkQuestionSql = @"
                            SELECT question_id FROM quiz.questions 
                            WHERE question_id = @question_id AND deleted_at IS NULL";

                        using (var checkReader = await _dbService.ExecuteQueryAsync(checkQuestionSql,
                            new NpgsqlParameter("question_id", question.QuestionId.Value)))
                        {
                            questionExists = await checkReader.ReadAsync();
                        } // Reader is disposed here

                        if (questionExists)
                        {
                            // Existing question - reuse it
                            questionId = question.QuestionId.Value;
                            _logger.LogInformation($"Reusing existing question {questionId}");
                        }
                        else
                        {
                            // QuestionId provided but doesn't exist - create new with this ID
                            questionId = question.QuestionId.Value;
                            await CreateQuestionAsync(questionId, question);
                            _logger.LogInformation($"Created new question with provided ID {questionId}");
                        }
                    }
                    else
                    {
                        // No questionId - create new question
                        questionId = Guid.NewGuid();
                        await CreateQuestionAsync(questionId, question);
                        _logger.LogInformation($"Created new question {questionId}");
                    }

                    // Add to mappings list
                    questionMappings.Add((questionId, question.Position ?? position));
                    position++;
                }

                // Step 3: Create quiz-question mappings
                foreach (var (questionId, pos) in questionMappings)
                {
                    var mappingSql = @"
                        INSERT INTO quiz.quiz_questions (quiz_id, question_id, position)
                        VALUES (@quiz_id, @question_id, @position)";

                    await _dbService.ExecuteNonQueryAsync(mappingSql,
                        new NpgsqlParameter("quiz_id", quizId),
                        new NpgsqlParameter("question_id", questionId),
                        new NpgsqlParameter("position", pos));
                }

                // Step 4: Fetch and return the complete quiz with questions
                var fetchQuizSql = @"
                    SELECT q.quiz_id, q.title, q.description, q.age_min, q.age_max, q.subject,
                           q.difficulty, q.estimated_minutes, q.tags, q.created_at, q.updated_at
                    FROM quiz.quizzes q
                    WHERE q.quiz_id = @quiz_id AND q.deleted_at IS NULL";

                QuizWithQuestions? result = null;
                using (var quizReader = await _dbService.ExecuteQueryAsync(fetchQuizSql,
                    new NpgsqlParameter("quiz_id", quizId)))
                {
                    if (await quizReader.ReadAsync())
                    {
                        result = new QuizWithQuestions
                        {
                            QuizId = quizReader.GetGuid(0),
                            Title = quizReader.GetString(1),
                            Description = quizReader.IsDBNull(2) ? null : quizReader.GetString(2),
                            AgeMin = quizReader.IsDBNull(3) ? null : quizReader.GetInt32(3),
                            AgeMax = quizReader.IsDBNull(4) ? null : quizReader.GetInt32(4),
                            Subject = quizReader.IsDBNull(5) ? null : quizReader.GetString(5),
                            Difficulty = quizReader.IsDBNull(6) ? null : quizReader.GetString(6),
                            EstimatedMinutes = quizReader.IsDBNull(7) ? null : quizReader.GetInt32(7),
                            Tags = quizReader.IsDBNull(8) ? null : (string[])quizReader.GetValue(8),
                            CreatedAt = quizReader.GetDateTime(9),
                            UpdatedAt = quizReader.GetDateTime(10)
                        };
                    }
                }

                if (result == null)
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve created quiz");
                }

                // Fetch questions
                var fetchQuestionsSql = @"
                    SELECT q.question_id, q.question_type, q.question_text, q.difficulty, 
                           q.points, q.estimated_seconds, qq.position
                    FROM quiz.questions q
                    INNER JOIN quiz.quiz_questions qq ON q.question_id = qq.question_id
                    WHERE qq.quiz_id = @quiz_id AND q.deleted_at IS NULL
                    ORDER BY qq.position";

                using (var questionsReader = await _dbService.ExecuteQueryAsync(fetchQuestionsSql,
                    new NpgsqlParameter("quiz_id", quizId)))
                {
                    while (await questionsReader.ReadAsync())
                    {
                        result.Questions.Add(new QuestionSummary
                        {
                            QuestionId = questionsReader.GetGuid(0),
                            QuestionType = questionsReader.GetString(1),
                            QuestionText = questionsReader.GetString(2),
                            Difficulty = questionsReader.IsDBNull(3) ? null : questionsReader.GetString(3),
                            Points = questionsReader.GetDecimal(4),
                            EstimatedSeconds = questionsReader.IsDBNull(5) ? null : questionsReader.GetInt32(5),
                            Position = questionsReader.IsDBNull(6) ? null : questionsReader.GetInt32(6)
                        });
                    }
                }

                _logger.LogInformation($"Batch imported quiz {quizId} with {result.Questions.Count} questions in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, result, $"/api/quizzes/{quizId}");
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                _logger.LogWarning(ex, "Unique constraint violation in batch import");
                return await ResponseHelper.BadRequestAsync(req, "Duplicate data detected in batch import");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch import");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to import quiz and questions");
            }
        }

        private async Task CreateQuestionAsync(Guid questionId, BatchImportQuestion question)
        {
            var sql = @"
                INSERT INTO quiz.questions (
                    question_id, question_type, question_text, age_min, age_max, difficulty,
                    estimated_seconds, subject, locale, points, allow_partial_credit,
                    negative_marking, supports_read_aloud, content, version, created_at, updated_at
                )
                VALUES (
                    @question_id, @question_type, @question_text, @age_min, @age_max, @difficulty,
                    @estimated_seconds, @subject, @locale, @points, @allow_partial_credit,
                    @negative_marking, @supports_read_aloud, @content::jsonb, @version, 
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )";

            var contentJson = JsonSerializer.Serialize(question.Content);

            await _dbService.ExecuteNonQueryAsync(sql,
                new NpgsqlParameter("question_id", questionId),
                new NpgsqlParameter("question_type", question.QuestionType),
                new NpgsqlParameter("question_text", question.QuestionText),
                new NpgsqlParameter("age_min", (object?)question.AgeMin ?? DBNull.Value),
                new NpgsqlParameter("age_max", (object?)question.AgeMax ?? DBNull.Value),
                new NpgsqlParameter("difficulty", (object?)question.Difficulty ?? DBNull.Value),
                new NpgsqlParameter("estimated_seconds", (object?)question.EstimatedSeconds ?? DBNull.Value),
                new NpgsqlParameter("subject", (object?)question.Subject ?? DBNull.Value),
                new NpgsqlParameter("locale", question.Locale ?? "en-US"),
                new NpgsqlParameter("points", question.Points ?? 10.0m),
                new NpgsqlParameter("allow_partial_credit", question.AllowPartialCredit ?? false),
                new NpgsqlParameter("negative_marking", question.NegativeMarking ?? false),
                new NpgsqlParameter("supports_read_aloud", question.SupportsReadAloud ?? true),
                new NpgsqlParameter("content", contentJson),
                new NpgsqlParameter("version", 1));
        }
    }
}


