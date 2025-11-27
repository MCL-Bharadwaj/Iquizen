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
using System;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Question
{
    public class QuestionWriteFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<QuestionWriteFunctions> _logger;

        public QuestionWriteFunctions(
            IDbService dbService,
            ILogger<QuestionWriteFunctions> logger)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [Function("CreateQuestion")]
        [OpenApiOperation(
            operationId: "CreateQuestion",
            tags: new[] { "Questions - Write" },
            Summary = "Create a new question",
            Description = "Creates a new question.")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(CreateQuestionRequest),
            Required = true,
            Description = "Question creation request")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Question),
            Description = "Question successfully created")]
        public async Task<HttpResponseData> CreateQuestion(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "questions")] HttpRequestData req)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "question:write", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin

                CreateQuestionRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<CreateQuestionRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null || string.IsNullOrWhiteSpace(request.QuestionType) || string.IsNullOrWhiteSpace(request.QuestionText))
                {
                    return await ResponseHelper.BadRequestAsync(req, "QuestionType and QuestionText are required");
                }

                var questionId = Guid.NewGuid();
                var contentJson = JsonSerializer.Serialize(request.Content);

                var sql = @"
                    INSERT INTO quiz.questions (question_id, question_type, question_text, age_min, age_max,
                                                 difficulty, estimated_seconds, subject, locale, points,
                                                 allow_partial_credit, negative_marking, supports_read_aloud,
                                                 content, version, created_at, updated_at)
                    VALUES (@question_id, @question_type, @question_text, @age_min, @age_max,
                            @difficulty, @estimated_seconds, @subject, @locale, @points,
                            @allow_partial_credit, @negative_marking, @supports_read_aloud,
                            @content::jsonb, @version, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING question_id, question_type, question_text, age_min, age_max,
                              difficulty, estimated_seconds, subject, locale, points,
                              allow_partial_credit, negative_marking, supports_read_aloud,
                              content, version, created_at, updated_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("question_id", questionId),
                    new NpgsqlParameter("question_type", request.QuestionType),
                    new NpgsqlParameter("question_text", request.QuestionText),
                    new NpgsqlParameter("age_min", (object?)request.AgeMin ?? DBNull.Value),
                    new NpgsqlParameter("age_max", (object?)request.AgeMax ?? DBNull.Value),
                    new NpgsqlParameter("difficulty", (object?)request.Difficulty ?? DBNull.Value),
                    new NpgsqlParameter("estimated_seconds", (object?)request.EstimatedSeconds ?? DBNull.Value),
                    new NpgsqlParameter("subject", (object?)request.Subject ?? DBNull.Value),
                    new NpgsqlParameter("locale", request.Locale ?? "en-US"),
                    new NpgsqlParameter("points", request.Points ?? 10.0m),
                    new NpgsqlParameter("allow_partial_credit", request.AllowPartialCredit ?? false),
                    new NpgsqlParameter("negative_marking", request.NegativeMarking ?? false),
                    new NpgsqlParameter("supports_read_aloud", request.SupportsReadAloud ?? true),
                    new NpgsqlParameter("content", contentJson),
                    new NpgsqlParameter("version", 1));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to create question");
                }

                var contentResult = reader.IsDBNull(13) ? "{}" : reader.GetString(13);
                var createdQuestion = new Quizz.DataModel.Dtos.Question
                {
                    QuestionId = reader.GetGuid(0),
                    QuestionType = reader.GetString(1),
                    QuestionText = reader.GetString(2),
                    AgeMin = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    AgeMax = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                    Difficulty = reader.IsDBNull(5) ? null : reader.GetString(5),
                    EstimatedSeconds = reader.IsDBNull(6) ? null : reader.GetInt32(6),
                    Subject = reader.IsDBNull(7) ? null : reader.GetString(7),
                    Locale = reader.IsDBNull(8) ? "en-US" : reader.GetString(8),
                    Points = reader.IsDBNull(9) ? 10.0m : reader.GetDecimal(9),
                    AllowPartialCredit = reader.IsDBNull(10) ? false : reader.GetBoolean(10),
                    NegativeMarking = reader.IsDBNull(11) ? false : reader.GetBoolean(11),
                    SupportsReadAloud = reader.IsDBNull(12) ? true : reader.GetBoolean(12),
                    Content = JsonSerializer.Deserialize<object>(contentResult),
                    Version = reader.IsDBNull(14) ? 1 : reader.GetInt32(14),
                    CreatedAt = reader.GetDateTime(15),
                    UpdatedAt = reader.GetDateTime(16)
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(req, _apiKeyService, validation.ApiKey.ApiKeyId, "CreateQuestion", 201, stopwatch);
                // }

                _logger.LogInformation($"Created question {questionId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, createdQuestion, $"/api/questions/{questionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating question");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to create question");
            }
        }

        [Function("DeleteQuestion")]
        [OpenApiOperation(
            operationId: "DeleteQuestion",
            tags: new[] { "Questions - Write" },
            Summary = "Delete a question",
            Description = "Soft deletes a question. Requires API key with 'question:delete' scope.")]
        [OpenApiSecurity("ApiKeyAuth", SecuritySchemeType.ApiKey, In = OpenApiSecurityLocationType.Header, Name = "X-API-Key")]
        [OpenApiParameter(
            name: "questionId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "The unique identifier of the question")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NoContent,
            contentType: "application/json",
            bodyType: typeof(void),
            Description = "Question successfully deleted")]
        public async Task<HttpResponseData> DeleteQuestion(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "questions/{questionId}")] HttpRequestData req,
            string questionId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "question:delete", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin

                if (!Guid.TryParse(questionId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid question ID format");
                }

                var sql = @"
                    UPDATE quiz.questions
                    SET deleted_at = CURRENT_TIMESTAMP
                    WHERE question_id = @question_id AND deleted_at IS NULL";

                var rowsAffected = await _dbService.ExecuteNonQueryAsync(sql,
                    new NpgsqlParameter("question_id", guid));

                if (rowsAffected == 0)
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Question with ID '{questionId}' not found");
                }

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(req, _apiKeyService, validation.ApiKey.ApiKeyId, "DeleteQuestion", 204, stopwatch);
                // }

                _logger.LogInformation($"Deleted question {questionId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.NoContentAsync(req);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting question {questionId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to delete question");
            }
        }

        [Function("AddQuestionToQuiz")]
        [OpenApiOperation(
            operationId: "AddQuestionToQuiz",
            tags: new[] { "Questions - Write" },
            Summary = "Add a question to a quiz",
            Description = "Associates a question with a quiz at a specific position. Requires API key with 'question:write' scope.")]
        [OpenApiSecurity("ApiKeyAuth", SecuritySchemeType.ApiKey, In = OpenApiSecurityLocationType.Header, Name = "X-API-Key")]
        [OpenApiParameter(
            name: "quizId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "The unique identifier of the quiz")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(AddQuestionToQuizRequest),
            Required = true,
            Description = "Question association request")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Question successfully added to quiz")]
        public async Task<HttpResponseData> AddQuestionToQuiz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "quizzes/{quizId}/questions")] HttpRequestData req,
            string quizId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "question:write", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin

                if (!Guid.TryParse(quizId, out var quizGuid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid quiz ID format");
                }

                AddQuestionToQuizRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<AddQuestionToQuizRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null || request.QuestionId == Guid.Empty)
                {
                    return await ResponseHelper.BadRequestAsync(req, "QuestionId is required");
                }

                // Check if quiz exists
                var quizCheckSql = "SELECT COUNT(*) FROM quiz.quizzes WHERE quiz_id = @quiz_id AND deleted_at IS NULL";
                int quizExists = 0;
                using (var quizCheckReader = await _dbService.ExecuteQueryAsync(quizCheckSql,
                    new NpgsqlParameter("quiz_id", quizGuid)))
                {
                    if (await quizCheckReader.ReadAsync())
                    {
                        quizExists = quizCheckReader.GetInt32(0);
                    }
                }

                if (quizExists == 0)
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Quiz with ID '{quizId}' not found");
                }

                // Check if question exists
                var questionCheckSql = "SELECT COUNT(*) FROM quiz.questions WHERE question_id = @question_id AND deleted_at IS NULL";
                int questionExists = 0;
                using (var questionCheckReader = await _dbService.ExecuteQueryAsync(questionCheckSql,
                    new NpgsqlParameter("question_id", request.QuestionId)))
                {
                    if (await questionCheckReader.ReadAsync())
                    {
                        questionExists = questionCheckReader.GetInt32(0);
                    }
                }

                if (questionExists == 0)
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Question with ID '{request.QuestionId}' not found");
                }

                // Get the next position if not specified
                int position = request.Position ?? 0;
                if (position == 0)
                {
                    var maxPositionSql = "SELECT COALESCE(MAX(position), 0) FROM quiz.quiz_questions WHERE quiz_id = @quiz_id";
                    using (var maxPosReader = await _dbService.ExecuteQueryAsync(maxPositionSql,
                        new NpgsqlParameter("quiz_id", quizGuid)))
                    {
                        if (await maxPosReader.ReadAsync())
                        {
                            position = maxPosReader.GetInt32(0) + 1;
                        }
                        else
                        {
                            position = 1;
                        }
                    }
                }

                _logger.LogInformation($"Adding question {request.QuestionId} to quiz {quizId} at position {position}");

                // Add question to quiz
                var sql = @"
                    INSERT INTO quiz.quiz_questions (quiz_id, question_id, position)
                    VALUES (@quiz_id, @question_id, @position)
                    ON CONFLICT (quiz_id, question_id) 
                    DO UPDATE SET position = EXCLUDED.position
                    RETURNING quiz_id, question_id, position";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("quiz_id", quizGuid),
                    new NpgsqlParameter("question_id", request.QuestionId),
                    new NpgsqlParameter("position", position));

                if (!await reader.ReadAsync())
                {
                    _logger.LogError($"Failed to insert/update question {request.QuestionId} in quiz {quizId}");
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to add question to quiz");
                }

                var result = new
                {
                    quizId = reader.GetGuid(0),
                    questionId = reader.GetGuid(1),
                    position = reader.GetInt32(2),
                    message = "Question successfully added to quiz"
                };

                _logger.LogInformation($"Successfully added question {request.QuestionId} to quiz {quizId} at position {position} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, result, $"/api/quizzes/{quizId}/questions");
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                _logger.LogWarning(ex, "Question already exists in quiz");
                return await ResponseHelper.BadRequestAsync(req, "This question is already in the quiz");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding question to quiz {quizId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to add question to quiz");
            }
        }

        [Function("UpdateQuestion")]
        [OpenApiOperation(
            operationId: "UpdateQuestion",
            tags: new[] { "Questions - Write" },
            Summary = "Update an existing question",
            Description = "Updates an existing question. Requires API key with 'question:write' scope.")]
        [OpenApiSecurity("ApiKeyAuth", SecuritySchemeType.ApiKey, In = OpenApiSecurityLocationType.Header, Name = "X-API-Key")]
        [OpenApiParameter(
            name: "questionId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(string),
            Description = "The unique identifier of the question")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(UpdateQuestionRequest),
            Required = true,
            Description = "Question update request")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Question),
            Description = "Question successfully updated")]
        public async Task<HttpResponseData> UpdateQuestion(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "questions/{questionId}")] HttpRequestData req,
            string questionId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "question:write", stopwatch);
                // if (errorResponse != null) return errorResponse;

                if (!Guid.TryParse(questionId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid question ID format");
                }

                UpdateQuestionRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<UpdateQuestionRequest>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (request == null || string.IsNullOrWhiteSpace(request.QuestionType) || string.IsNullOrWhiteSpace(request.QuestionText))
                {
                    return await ResponseHelper.BadRequestAsync(req, "QuestionType and QuestionText are required");
                }

                var contentJson = JsonSerializer.Serialize(request.Content);

                var sql = @"
                    UPDATE quiz.questions
                    SET question_type = @question_type,
                        question_text = @question_text,
                        age_min = @age_min,
                        age_max = @age_max,
                        difficulty = @difficulty,
                        estimated_seconds = @estimated_seconds,
                        subject = @subject,
                        locale = @locale,
                        points = @points,
                        allow_partial_credit = @allow_partial_credit,
                        negative_marking = @negative_marking,
                        supports_read_aloud = @supports_read_aloud,
                        content = @content::jsonb,
                        version = version + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE question_id = @question_id AND deleted_at IS NULL
                    RETURNING question_id, question_type, question_text, age_min, age_max,
                              difficulty, estimated_seconds, subject, locale, points,
                              allow_partial_credit, negative_marking, supports_read_aloud,
                              content, version, created_at, updated_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("question_id", guid),
                    new NpgsqlParameter("question_type", request.QuestionType),
                    new NpgsqlParameter("question_text", request.QuestionText),
                    new NpgsqlParameter("age_min", (object?)request.AgeMin ?? DBNull.Value),
                    new NpgsqlParameter("age_max", (object?)request.AgeMax ?? DBNull.Value),
                    new NpgsqlParameter("difficulty", (object?)request.Difficulty ?? DBNull.Value),
                    new NpgsqlParameter("estimated_seconds", (object?)request.EstimatedSeconds ?? DBNull.Value),
                    new NpgsqlParameter("subject", (object?)request.Subject ?? DBNull.Value),
                    new NpgsqlParameter("locale", request.Locale ?? "en-US"),
                    new NpgsqlParameter("points", request.Points ?? 10.0m),
                    new NpgsqlParameter("allow_partial_credit", request.AllowPartialCredit ?? false),
                    new NpgsqlParameter("negative_marking", request.NegativeMarking ?? false),
                    new NpgsqlParameter("supports_read_aloud", request.SupportsReadAloud ?? true),
                    new NpgsqlParameter("content", contentJson));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Question with ID '{questionId}' not found");
                }

                var contentResult = reader.IsDBNull(13) ? "{}" : reader.GetString(13);
                var updatedQuestion = new Quizz.DataModel.Dtos.Question
                {
                    QuestionId = reader.GetGuid(0),
                    QuestionType = reader.GetString(1),
                    QuestionText = reader.GetString(2),
                    AgeMin = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    AgeMax = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                    Difficulty = reader.IsDBNull(5) ? null : reader.GetString(5),
                    EstimatedSeconds = reader.IsDBNull(6) ? null : reader.GetInt32(6),
                    Subject = reader.IsDBNull(7) ? null : reader.GetString(7),
                    Locale = reader.IsDBNull(8) ? "en-US" : reader.GetString(8),
                    Points = reader.IsDBNull(9) ? 10.0m : reader.GetDecimal(9),
                    AllowPartialCredit = reader.IsDBNull(10) ? false : reader.GetBoolean(10),
                    NegativeMarking = reader.IsDBNull(11) ? false : reader.GetBoolean(11),
                    SupportsReadAloud = reader.IsDBNull(12) ? true : reader.GetBoolean(12),
                    Content = JsonSerializer.Deserialize<object>(contentResult),
                    Version = reader.IsDBNull(14) ? 1 : reader.GetInt32(14),
                    CreatedAt = reader.GetDateTime(15),
                    UpdatedAt = reader.GetDateTime(16)
                };

                _logger.LogInformation($"Updated question {questionId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, updatedQuestion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating question {questionId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to update question");
            }
        }
    }
}


