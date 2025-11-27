using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;
using NpgsqlTypes;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using Quizz.Functions.Helpers;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Question
{
    /// <summary>
    /// Read-only question operations (public endpoints - no API key required).
    /// GET operations for retrieving question data.
    /// </summary>
    public class QuestionReadFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<QuestionReadFunctions> _logger;

        public QuestionReadFunctions(
            IDbService dbService,
            ILogger<QuestionReadFunctions> logger)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [Function("GetQuestions")]
        [OpenApiOperation(
            operationId: "GetQuestions",
            tags: new[] { "Questions - Read" },
            Summary = "Get all questions",
            Description = "Retrieves a paginated list of questions with optional filtering. No API key required.")]
        [OpenApiParameter(
            name: "questionType",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Filter by question type")]
        [OpenApiParameter(
            name: "difficulty",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Filter by difficulty level")]
        [OpenApiParameter(
            name: "subject",
            In = ParameterLocation.Query,
            Required = false,
            Type = typeof(string),
            Description = "Filter by subject")]
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
            Description = "Successfully retrieved list of questions")]
        public async Task<HttpResponseData> GetQuestions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "questions")] HttpRequestData req)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
                var questionType = query["questionType"];
                var difficulty = query["difficulty"];
                var subject = query["subject"];
                var limit = int.TryParse(query["limit"], out var l) ? Math.Min(l, 100) : 50;
                var offset = int.TryParse(query["offset"], out var o) ? Math.Max(o, 0) : 0;

                var sql = @"
                    SELECT question_id, question_type, question_text, age_min, age_max, 
                           difficulty, estimated_seconds, subject, locale, points, 
                           allow_partial_credit, negative_marking, supports_read_aloud,
                           content, version, created_at, updated_at
                    FROM quiz.questions
                    WHERE deleted_at IS NULL";

                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrWhiteSpace(questionType))
                {
                    sql += " AND question_type = @question_type";
                    parameters.Add(new NpgsqlParameter("question_type", questionType));
                }

                if (!string.IsNullOrWhiteSpace(difficulty))
                {
                    sql += " AND difficulty = @difficulty";
                    parameters.Add(new NpgsqlParameter("difficulty", difficulty));
                }

                if (!string.IsNullOrWhiteSpace(subject))
                {
                    sql += " AND subject = @subject";
                    parameters.Add(new NpgsqlParameter("subject", subject));
                }

                sql += " ORDER BY created_at DESC LIMIT @limit OFFSET @offset";
                parameters.Add(new NpgsqlParameter("limit", limit));
                parameters.Add(new NpgsqlParameter("offset", offset));

                _logger.LogInformation($"Executing query: {sql}");
                _logger.LogInformation($"Parameters: limit={limit}, offset={offset}");

                using var reader = await _dbService.ExecuteQueryAsync(sql, parameters.ToArray());

                _logger.LogInformation($"Query executed, reader created. HasRows: {reader.HasRows}");

                var questions = new List<Quizz.DataModel.Dtos.Question>();
                while (await reader.ReadAsync())
                {
                    _logger.LogInformation($"Reading question row...");
                    var contentJson = reader.IsDBNull(13) ? "{}" : reader.GetString(13);
                    
                    questions.Add(new Quizz.DataModel.Dtos.Question
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
                        Points = reader.IsDBNull(9) ? 10.0m : reader.GetDecimal(9), // Default 10 points
                        AllowPartialCredit = reader.IsDBNull(10) ? false : reader.GetBoolean(10), // Default false
                        NegativeMarking = reader.IsDBNull(11) ? false : reader.GetBoolean(11), // Default false
                        SupportsReadAloud = reader.IsDBNull(12) ? true : reader.GetBoolean(12), // Default true
                        Content = JsonSerializer.Deserialize<object>(contentJson),
                        Version = reader.IsDBNull(14) ? 1 : reader.GetInt32(14), // Default version 1
                        CreatedAt = reader.GetDateTime(15),
                        UpdatedAt = reader.GetDateTime(16)
                    });
                }

                var response = new
                {
                    data = questions,
                    count = questions.Count,
                    limit,
                    offset
                };

                _logger.LogInformation($"Retrieved {questions.Count} questions in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving questions");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve questions");
            }
        }

        [Function("GetQuestionById")]
        [OpenApiOperation(
            operationId: "GetQuestionById",
            tags: new[] { "Questions - Read" },
            Summary = "Get question by ID",
            Description = "Retrieves detailed information about a specific question. No API key required.")]
        [OpenApiParameter(
            name: "questionId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid),
            Description = "The unique identifier of the question")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Question),
            Description = "Successfully retrieved question")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.NotFound,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Question not found")]
        public async Task<HttpResponseData> GetQuestionById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "questions/{questionId}")] HttpRequestData req,
            string questionId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(questionId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid question ID format");
                }

                var sql = @"
                    SELECT question_id, question_type, question_text, age_min, age_max, 
                           difficulty, estimated_seconds, subject, locale, points, 
                           allow_partial_credit, negative_marking, supports_read_aloud,
                           content, version, created_at, updated_at
                    FROM quiz.questions
                    WHERE question_id = @question_id AND deleted_at IS NULL";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("question_id", guid));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Question with ID '{questionId}' not found");
                }

                var contentJson = reader.IsDBNull(13) ? "{}" : reader.GetString(13);

                var question = new Quizz.DataModel.Dtos.Question
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
                    Content = JsonSerializer.Deserialize<object>(contentJson),
                    Version = reader.IsDBNull(14) ? 1 : reader.GetInt32(14),
                    CreatedAt = reader.GetDateTime(15),
                    UpdatedAt = reader.GetDateTime(16)
                };

                _logger.LogInformation($"Retrieved question {questionId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, question);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving question {questionId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve question");
            }
        }

        [Function("GetQuizQuestions")]
        [OpenApiOperation(
            operationId: "GetQuizQuestions",
            tags: new[] { "Questions - Read" },
            Summary = "Get questions for a specific quiz",
            Description = "Retrieves all questions associated with a quiz, ordered by position. No API key required.")]
        [OpenApiParameter(
            name: "quizId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid),
            Description = "The unique identifier of the quiz")]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved quiz questions")]
        public async Task<HttpResponseData> GetQuizQuestions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "quizzes/{quizId}/questions")] HttpRequestData req,
            string quizId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(quizId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid quiz ID format");
                }

                var sql = @"
                    SELECT q.question_id, q.question_type, q.question_text, q.age_min, q.age_max, 
                           q.difficulty, q.estimated_seconds, q.subject, q.locale, q.points, 
                           q.allow_partial_credit, q.negative_marking, q.supports_read_aloud,
                           q.content, q.version, q.created_at, q.updated_at, qq.position
                    FROM quiz.questions q
                    INNER JOIN quiz.quiz_questions qq ON q.question_id = qq.question_id
                    WHERE qq.quiz_id = @quiz_id 
                      AND q.deleted_at IS NULL
                    ORDER BY qq.position";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("quiz_id", guid));

                var questions = new List<object>();
                while (await reader.ReadAsync())
                {
                    var contentJson = reader.IsDBNull(13) ? "{}" : reader.GetString(13);

                    questions.Add(new
                    {
                        questionId = reader.GetGuid(0),
                        questionType = reader.GetString(1),
                        questionText = reader.GetString(2),
                        ageMin = reader.IsDBNull(3) ? (int?)null : reader.GetInt32(3),
                        ageMax = reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4),
                        difficulty = reader.IsDBNull(5) ? null : reader.GetString(5),
                        estimatedSeconds = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6),
                        subject = reader.IsDBNull(7) ? null : reader.GetString(7),
                        locale = reader.IsDBNull(8) ? "en-US" : reader.GetString(8),
                        points = reader.IsDBNull(9) ? 10.0m : reader.GetDecimal(9),
                        allowPartialCredit = reader.IsDBNull(10) ? false : reader.GetBoolean(10),
                        negativeMarking = reader.IsDBNull(11) ? false : reader.GetBoolean(11),
                        supportsReadAloud = reader.IsDBNull(12) ? true : reader.GetBoolean(12),
                        content = JsonSerializer.Deserialize<object>(contentJson),
                        version = reader.IsDBNull(14) ? 1 : reader.GetInt32(14),
                        createdAt = reader.GetDateTime(15),
                        updatedAt = reader.GetDateTime(16),
                        position = reader.GetInt32(17)
                    });
                }

                var response = new
                {
                    quizId = guid,
                    questions,
                    totalQuestions = questions.Count
                };

                _logger.LogInformation($"Retrieved {questions.Count} questions for quiz {quizId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving questions for quiz {quizId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve quiz questions");
            }
        }
    }
}


