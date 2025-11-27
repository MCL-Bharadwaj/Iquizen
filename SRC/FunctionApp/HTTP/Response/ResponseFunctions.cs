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
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quizz.Functions.Endpoints.Response
{
    public class ResponseFunctions
    {
        private readonly IDbService _dbService;
        private readonly ILogger<ResponseFunctions> _logger;

        public ResponseFunctions(
            IDbService dbService,
            ILogger<ResponseFunctions> logger)
        {
            _dbService = dbService ?? throw new ArgumentNullException(nameof(dbService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [Function("SubmitAnswer")]
        [OpenApiOperation(
            operationId: "SubmitAnswer",
            tags: new[] { "Responses" },
            Summary = "Submit an answer to a question",
            Description = "Records a user's answer to a question in an attempt.")]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(SubmitAnswerRequest),
            Required = true)]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.Created,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Response),
            Description = "Answer submitted successfully")]
        public async Task<HttpResponseData> SubmitAnswer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "responses")] HttpRequestData req)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "response:write", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: student (own responses), content_creator, admin

                SubmitAnswerRequest? request;
                try
                {
                    request = await JsonSerializer.DeserializeAsync<SubmitAnswerRequest>(req.Body);
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

                var responseId = Guid.NewGuid();
                var answerJson = JsonSerializer.Serialize(request.AnswerPayload);

                _logger.LogInformation($"Processing answer submission: responseId={responseId}, attemptId={request.AttemptId}, questionId={request.QuestionId}");

                // Fetch the correct answer AND points from questions table for auto-grading
                // SECURITY: Don't trust points from frontend - always fetch from database
                var questionSql = @"
                    SELECT points, content, question_type 
                    FROM quiz.questions 
                    WHERE question_id = @question_id";

                decimal pointsEarned = 0;
                decimal pointsPossible = 0;
                bool isCorrect = false;

                using (var questionReader = await _dbService.ExecuteQueryAsync(questionSql,
                    new NpgsqlParameter("question_id", request.QuestionId)))
                {
                    if (await questionReader.ReadAsync())
                    {
                        // Get authoritative points value from database (column 0)
                        pointsPossible = questionReader.IsDBNull(0) ? 10.0m : questionReader.GetDecimal(0);
                        
                        var contentJson = questionReader.GetString(1);
                        var questionType = questionReader.GetString(2);
                        
                        var questionContent = JsonSerializer.Deserialize<JsonElement>(contentJson);
                        
                        // Auto-grade based on question type
                        _logger.LogInformation($"Checking answer for question {request.QuestionId}, type: {questionType}");
                        _logger.LogInformation($"Student answer: {JsonSerializer.Serialize(request.AnswerPayload)}");
                        _logger.LogInformation($"Correct answer from DB: {contentJson}");
                        
                        isCorrect = CheckAnswer(questionContent, request.AnswerPayload, questionType);
                        pointsEarned = isCorrect ? pointsPossible : 0;
                        
                        _logger.LogInformation($"Answer check result: isCorrect={isCorrect}, pointsEarned={pointsEarned}, pointsPossible={pointsPossible}");
                    }
                    else
                    {
                        _logger.LogError($"Question {request.QuestionId} not found in database");
                        return await ResponseHelper.NotFoundAsync(req, $"Question {request.QuestionId} not found");
                    }
                }

                var sql = @"
                    INSERT INTO quiz.responses (
                        response_id, attempt_id, question_id, answer_payload, 
                        submitted_at, points_possible, points_earned, is_correct, graded_at
                    )
                    VALUES (
                        @response_id, @attempt_id, @question_id, @answer_payload::jsonb, 
                        CURRENT_TIMESTAMP, @points_possible, @points_earned, @is_correct, CURRENT_TIMESTAMP
                    )
                    RETURNING response_id, attempt_id, question_id, answer_payload, submitted_at,
                              points_possible, points_earned, is_correct, grading_details, graded_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("response_id", responseId),
                    new NpgsqlParameter("attempt_id", request.AttemptId),
                    new NpgsqlParameter("question_id", request.QuestionId),
                    new NpgsqlParameter("answer_payload", answerJson),
                    new NpgsqlParameter("points_possible", pointsPossible),
                    new NpgsqlParameter("points_earned", pointsEarned),
                    new NpgsqlParameter("is_correct", isCorrect));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.InternalServerErrorAsync(req, "Failed to submit answer");
                }

                var answerResult = reader.GetString(3);
                var gradingResult = reader.IsDBNull(8) ? null : reader.GetString(8);

                var response = new Quizz.DataModel.Dtos.Response
                {
                    ResponseId = reader.GetGuid(0),
                    AttemptId = reader.GetGuid(1),
                    QuestionId = reader.GetGuid(2),
                    AnswerPayload = JsonSerializer.Deserialize<object>(answerResult) ?? new { },
                    SubmittedAt = reader.GetDateTime(4),
                    PointsPossible = reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                    PointsEarned = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                    IsCorrect = reader.IsDBNull(7) ? null : reader.GetBoolean(7),
                    GradingDetails = gradingResult != null ? JsonSerializer.Deserialize<object>(gradingResult) : null,
                    GradedAt = reader.IsDBNull(9) ? null : reader.GetDateTime(9),
                    ScorePercentage = null // Calculated on the frontend or in CompleteAttempt
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(req, _apiKeyService, validation.ApiKey.ApiKeyId, "SubmitAnswer", 201, stopwatch);
                // }

                _logger.LogInformation($"Submitted answer {responseId} for attempt {request.AttemptId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.CreatedAsync(req, response, $"/api/responses/{responseId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting answer");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to submit answer");
            }
        }

        [Function("GetAttemptResponses")]
        [OpenApiOperation(
            operationId: "GetAttemptResponses",
            tags: new[] { "Responses" },
            Summary = "Get all responses for an attempt",
            Description = "Retrieves all responses submitted for a specific attempt. No API key required.")]
        [OpenApiParameter(
            name: "attemptId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid))]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(object),
            Description = "Successfully retrieved responses")]
        public async Task<HttpResponseData> GetAttemptResponses(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "attempts/{attemptId}/responses")] HttpRequestData req,
            string attemptId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(attemptId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid attempt ID format");
                }

                var sql = @"
                    SELECT response_id, attempt_id, question_id, answer_payload, submitted_at,
                           points_earned, points_possible, is_correct, grading_details, graded_at
                    FROM quiz.responses
                    WHERE attempt_id = @attempt_id
                    ORDER BY submitted_at";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("attempt_id", guid));

                var responses = new List<Quizz.DataModel.Dtos.Response>();
                while (await reader.ReadAsync())
                {
                    var answerResult = reader.GetString(3);
                    var gradingResult = reader.IsDBNull(8) ? null : reader.GetString(8);
                    decimal? pointsEarned = reader.IsDBNull(5) ? (decimal?)null : reader.GetDecimal(5);
                    decimal? pointsPossible = reader.IsDBNull(6) ? (decimal?)null : reader.GetDecimal(6);
                    decimal? scorePercentage = null;
                    if (pointsEarned.HasValue && pointsPossible.HasValue && pointsPossible.Value > 0)
                    {
                        scorePercentage = (pointsEarned.Value / pointsPossible.Value) * 100;
                    }

                    responses.Add(new Quizz.DataModel.Dtos.Response
                    {
                        ResponseId = reader.GetGuid(0),
                        AttemptId = reader.GetGuid(1),
                        QuestionId = reader.GetGuid(2),
                        AnswerPayload = JsonSerializer.Deserialize<object>(answerResult) ?? new { },
                        SubmittedAt = reader.GetDateTime(4),
                        PointsEarned = pointsEarned,
                        PointsPossible = pointsPossible,
                        IsCorrect = reader.IsDBNull(7) ? null : reader.GetBoolean(7),
                        GradingDetails = gradingResult != null ? JsonSerializer.Deserialize<object>(gradingResult) : null,
                        GradedAt = reader.IsDBNull(9) ? null : reader.GetDateTime(9),
                        ScorePercentage = scorePercentage
                    });
                }

                var result = new
                {
                    attemptId = guid,
                    responses,
                    count = responses.Count
                };

                _logger.LogInformation($"Retrieved {responses.Count} responses for attempt {attemptId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving responses for attempt {attemptId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve responses");
            }
        }

        [Function("GetResponseById")]
        [OpenApiOperation(
            operationId: "GetResponseById",
            tags: new[] { "Responses" },
            Summary = "Get response by ID",
            Description = "Retrieves a specific response by its ID. No API key required.")]
        [OpenApiParameter(
            name: "responseId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid))]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Response),
            Description = "Successfully retrieved response")]
        public async Task<HttpResponseData> GetResponseById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "responses/{responseId}")] HttpRequestData req,
            string responseId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!Guid.TryParse(responseId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid response ID format");
                }

                var sql = @"
                    SELECT response_id, attempt_id, question_id, answer_payload, submitted_at,
                           points_earned, points_possible, is_correct, grading_details, graded_at
                    FROM quiz.responses
                    WHERE response_id = @response_id";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("response_id", guid));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Response with ID '{responseId}' not found");
                }

                var answerResult = reader.GetString(3);
                var gradingResult = reader.IsDBNull(8) ? null : reader.GetString(8);
                
                // Read points
                decimal? pointsEarned = reader.IsDBNull(5) ? (decimal?)null : reader.GetDecimal(5);
                decimal? pointsPossible = reader.IsDBNull(6) ? (decimal?)null : reader.GetDecimal(6);
                
                // Calculate score percentage if both values are available
                decimal? scorePercentage = null;
                if (pointsEarned.HasValue && pointsPossible.HasValue && pointsPossible.Value > 0)
                {
                    scorePercentage = (pointsEarned.Value / pointsPossible.Value) * 100;
                }

                var response = new Quizz.DataModel.Dtos.Response
                {
                    ResponseId = reader.GetGuid(0),
                    AttemptId = reader.GetGuid(1),
                    QuestionId = reader.GetGuid(2),
                    AnswerPayload = JsonSerializer.Deserialize<object>(answerResult) ?? new { },
                    SubmittedAt = reader.GetDateTime(4),
                    PointsEarned = pointsEarned,
                    PointsPossible = pointsPossible,
                    IsCorrect = reader.IsDBNull(7) ? null : reader.GetBoolean(7),
                    GradingDetails = gradingResult != null ? JsonSerializer.Deserialize<object>(gradingResult) : null,
                    GradedAt = reader.IsDBNull(9) ? null : reader.GetDateTime(9),
                    ScorePercentage = scorePercentage
                };

                _logger.LogInformation($"Retrieved response {responseId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving response {responseId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to retrieve response");
            }
        }

        [Function("GradeResponse")]
        [OpenApiOperation(
            operationId: "GradeResponse",
            tags: new[] { "Responses" },
            Summary = "Grade a response",
            Description = "Grades a response and updates the score. Requires API key with 'response:grade' scope.")]
        [OpenApiSecurity("ApiKeyAuth", SecuritySchemeType.ApiKey, In = OpenApiSecurityLocationType.Header, Name = "X-API-Key")]
        [OpenApiParameter(
            name: "responseId",
            In = ParameterLocation.Path,
            Required = true,
            Type = typeof(Guid))]
        [OpenApiRequestBody(
            contentType: "application/json",
            bodyType: typeof(GradingResult),
            Required = true)]
        [OpenApiResponseWithBody(
            statusCode: HttpStatusCode.OK,
            contentType: "application/json",
            bodyType: typeof(Quizz.DataModel.Dtos.Response),
            Description = "Response graded successfully")]
        public async Task<HttpResponseData> GradeResponse(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "responses/{responseId}/grade")] HttpRequestData req,
            string responseId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // API Key Authentication (Commented out for LMS integration)
                // Uncomment when you want to use API key authentication instead of LMS session auth
                // var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                //     req, _apiKeyService, "response:grade", stopwatch);
                // if (errorResponse != null) return errorResponse;

                // TODO: Add user role validation when LMS authentication is integrated
                // Expected roles: content_creator, admin (grading permissions)

                if (!Guid.TryParse(responseId, out var guid))
                {
                    return await ResponseHelper.BadRequestAsync(req, "Invalid response ID format");
                }

                GradingResult? gradingResult;
                try
                {
                    gradingResult = await JsonSerializer.DeserializeAsync<GradingResult>(req.Body);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Invalid JSON in request body");
                    return await ResponseHelper.BadRequestAsync(req, "Invalid JSON format");
                }

                if (gradingResult == null)
                {
                    return await ResponseHelper.BadRequestAsync(req, "Grading result is required");
                }

                var scorePercentage = gradingResult.PointsPossible > 0 
                    ? (gradingResult.PointsEarned / gradingResult.PointsPossible) * 100 
                    : 0;

                var gradingDetailsJson = gradingResult.GradingDetails != null 
                    ? JsonSerializer.Serialize(gradingResult.GradingDetails) 
                    : null;

                var sql = @"
                    UPDATE quiz.responses
                    SET points_earned = @points_earned,
                        points_possible = @points_possible,
                        is_correct = @is_correct,
                        grading_details = @grading_details::jsonb,
                        graded_at = CURRENT_TIMESTAMP,
                        score_percentage = @score_percentage
                    WHERE response_id = @response_id
                    RETURNING response_id, attempt_id, question_id, answer_payload, submitted_at,
                              points_earned, points_possible, is_correct, grading_details, graded_at, score_percentage";

                using var reader = await _dbService.ExecuteQueryAsync(sql,
                    new NpgsqlParameter("response_id", guid),
                    new NpgsqlParameter("points_earned", gradingResult.PointsEarned),
                    new NpgsqlParameter("points_possible", gradingResult.PointsPossible),
                    new NpgsqlParameter("is_correct", gradingResult.IsCorrect),
                    new NpgsqlParameter("grading_details", (object?)gradingDetailsJson ?? DBNull.Value),
                    new NpgsqlParameter("score_percentage", scorePercentage));

                if (!await reader.ReadAsync())
                {
                    return await ResponseHelper.NotFoundAsync(req, $"Response with ID '{responseId}' not found");
                }

                var answerResult = reader.GetString(3);
                var gradingDetailsResult = reader.IsDBNull(8) ? null : reader.GetString(8);

                var response = new Quizz.DataModel.Dtos.Response
                {
                    ResponseId = reader.GetGuid(0),
                    AttemptId = reader.GetGuid(1),
                    QuestionId = reader.GetGuid(2),
                    AnswerPayload = JsonSerializer.Deserialize<object>(answerResult) ?? new { },
                    SubmittedAt = reader.GetDateTime(4),
                    PointsEarned = reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                    PointsPossible = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                    IsCorrect = reader.IsDBNull(7) ? null : reader.GetBoolean(7),
                    GradingDetails = gradingDetailsResult != null ? JsonSerializer.Deserialize<object>(gradingDetailsResult) : null,
                    GradedAt = reader.IsDBNull(9) ? null : reader.GetDateTime(9),
                    ScorePercentage = reader.IsDBNull(10) ? null : reader.GetDecimal(10)
                };

                // API Key Usage Logging (Commented out for LMS integration)
                // if (validation?.ApiKey != null)
                // {
                //     await AuthHelper.LogSuccessfulUsageAsync(req, _apiKeyService, validation.ApiKey.ApiKeyId, "GradeResponse", 200, stopwatch);
                // }

                _logger.LogInformation($"Graded response {responseId} in {stopwatch.ElapsedMilliseconds}ms");
                return await ResponseHelper.OkAsync(req, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error grading response {responseId}");
                return await ResponseHelper.InternalServerErrorAsync(req, "Failed to grade response");
            }
        }

        /// <summary>
        /// Auto-grade answer by comparing player response with correct answer
        /// </summary>
        private bool CheckAnswer(JsonElement questionContent, object playerAnswer, string questionType)
        {
            try
            {
                var playerAnswerJson = JsonSerializer.Serialize(playerAnswer);
                var playerAnswerElement = JsonSerializer.Deserialize<JsonElement>(playerAnswerJson);

                switch (questionType.ToLower())
                {
                    case "multiple_choice_single":
                        // Compare selected option ID
                        // Frontend sends either "a" (string) or {"selectedOptionId": "a"} (object)
                        if (questionContent.TryGetProperty("correct_answer", out var correctAnswer))
                        {
                            string playerSelection = null;
                            
                            // Check if it's a string first (frontend sends raw string)
                            if (playerAnswerElement.ValueKind == JsonValueKind.String)
                            {
                                playerSelection = playerAnswerElement.GetString();
                            }
                            // If it's an object, try to get the "selectedOptionId" property
                            else if (playerAnswerElement.ValueKind == JsonValueKind.Object &&
                                     playerAnswerElement.TryGetProperty("selectedOptionId", out var selectedOption))
                            {
                                playerSelection = selectedOption.GetString();
                            }
                            
                            if (playerSelection != null)
                            {
                                return correctAnswer.GetString() == playerSelection;
                            }
                        }
                        break;

                    case "multiple_choice_multi":
                        // Compare array of selected option IDs
                        // Frontend sends either ["a","b"] (array) or {"selectedOptionIds": ["a","b"]} (object)
                        if (questionContent.TryGetProperty("correct_answers", out var correctAnswers))
                        {
                            JsonElement selectedOptionsElement;
                            
                            // Check if it's already an array first (frontend sends raw array)
                            if (playerAnswerElement.ValueKind == JsonValueKind.Array)
                            {
                                selectedOptionsElement = playerAnswerElement;
                            }
                            // If it's an object, try to get the "selectedOptionIds" property
                            else if (playerAnswerElement.ValueKind == JsonValueKind.Object &&
                                     playerAnswerElement.TryGetProperty("selectedOptionIds", out var selectedOptionsObj))
                            {
                                selectedOptionsElement = selectedOptionsObj;
                            }
                            else
                            {
                                break;
                            }
                            
                            var correctSet = correctAnswers.EnumerateArray()
                                .Select(x => x.GetString())
                                .OrderBy(x => x)
                                .ToList();
                            var playerSet = selectedOptionsElement.EnumerateArray()
                                .Select(x => x.GetString())
                                .OrderBy(x => x)
                                .ToList();
                            return correctSet.SequenceEqual(playerSet);
                        }
                        break;

                    case "true_false":
                        // Compare boolean value
                        // Frontend sends either true/false (boolean) or {"answer": true/false} (object)
                        if (questionContent.TryGetProperty("correctAnswer", out var correctTF))
                        {
                            bool? playerTFValue = null;
                            
                            // Check if it's a boolean first (frontend sends raw boolean)
                            if (playerAnswerElement.ValueKind == JsonValueKind.True || 
                                playerAnswerElement.ValueKind == JsonValueKind.False)
                            {
                                playerTFValue = playerAnswerElement.GetBoolean();
                            }
                            // If it's an object, try to get the "answer" property
                            else if (playerAnswerElement.ValueKind == JsonValueKind.Object &&
                                     playerAnswerElement.TryGetProperty("answer", out var studentTFObj))
                            {
                                playerTFValue = studentTFObj.GetBoolean();
                            }
                            
                            if (playerTFValue.HasValue)
                            {
                                return correctTF.GetBoolean() == playerTFValue.Value;
                            }
                        }
                        break;

                    case "matching":
                        // Compare pairs array
                        if ((questionContent.TryGetProperty("correctPairs", out var correctPairs) || 
                             questionContent.TryGetProperty("correct_pairs", out correctPairs)) &&
                            playerAnswerElement.TryGetProperty("pairs", out var playerPairs))
                        {
                            var correctPairsList = correctPairs.EnumerateArray()
                                .Select(p => new { 
                                    Left = p.GetProperty("left").GetString(), 
                                    Right = p.GetProperty("right").GetString() 
                                })
                                .OrderBy(p => p.Left)
                                .ToList();
                            var playerPairsList = playerPairs.EnumerateArray()
                                .Select(p => new { 
                                    Left = p.GetProperty("left").GetString(), 
                                    Right = p.GetProperty("right").GetString() 
                                })
                                .OrderBy(p => p.Left)
                                .ToList();
                            
                            if (correctPairsList.Count != playerPairsList.Count) return false;
                            
                            for (int i = 0; i < correctPairsList.Count; i++)
                            {
                                if (correctPairsList[i].Left != playerPairsList[i].Left ||
                                    correctPairsList[i].Right != playerPairsList[i].Right)
                                {
                                    return false;
                                }
                            }
                            return true;
                        }
                        break;

                    case "ordering":
                        // Compare order array
                        if ((questionContent.TryGetProperty("correctOrder", out var correctOrder) ||
                             questionContent.TryGetProperty("correct_order", out correctOrder)) &&
                            playerAnswerElement.TryGetProperty("order", out var playerOrder))
                        {
                            var correctList = correctOrder.EnumerateArray()
                                .Select(x => x.GetString())
                                .ToList();
                            var playerList = playerOrder.EnumerateArray()
                                .Select(x => x.GetString())
                                .ToList();
                            return correctList.SequenceEqual(playerList);
                        }
                        break;

                    case "fill_in_blank":
                        // Compare text answers (case-insensitive)
                        // Frontend sends either ["on","4","1"] (array) or {"answers": ["on","4","1"]} (object)
                        if (questionContent.TryGetProperty("blanks", out var blanks))
                        {
                            JsonElement playerAnswersElement;
                            
                            // Check if it's already an array first (frontend sends raw array)
                            if (playerAnswerElement.ValueKind == JsonValueKind.Array)
                            {
                                playerAnswersElement = playerAnswerElement;
                            }
                            // If it's an object, try to get the "answers" property
                            else if (playerAnswerElement.ValueKind == JsonValueKind.Object &&
                                     playerAnswerElement.TryGetProperty("answers", out var answersObj))
                            {
                                playerAnswersElement = answersObj;
                            }
                            else
                            {
                                break;
                            }
                            
                            var blanksArray = blanks.EnumerateArray().ToList();
                            var playerAnswersArray = playerAnswersElement.EnumerateArray().ToList();
                            
                            if (blanksArray.Count != playerAnswersArray.Count) return false;
                            
                            for (int i = 0; i < blanksArray.Count; i++)
                            {
                                var blank = blanksArray[i];
                                var studentAns = playerAnswersArray[i].GetString()?.Trim().ToLower();
                                
                                if (blank.TryGetProperty("accepted_answers", out var acceptedAnswers))
                                {
                                    var acceptedList = acceptedAnswers.EnumerateArray()
                                        .Select(x => x.GetString()?.Trim().ToLower())
                                        .ToList();
                                    
                                    if (!acceptedList.Contains(studentAns))
                                    {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        }
                        break;

                    case "fill_in_blank_drag_drop":
                        // Compare drag-drop selections (word bank IDs)
                        // Frontend sends {"blanks": [{"position": 1, "selected_id": "op1"}, ...]}
                        if (questionContent.TryGetProperty("blanks", out var dragDropBlanks))
                        {
                            JsonElement playerAnswersElement;
                            
                            // Get player's blanks array
                            if (playerAnswerElement.ValueKind == JsonValueKind.Object &&
                                playerAnswerElement.TryGetProperty("blanks", out var answersObj))
                            {
                                playerAnswersElement = answersObj;
                            }
                            else if (playerAnswerElement.ValueKind == JsonValueKind.Array)
                            {
                                playerAnswersElement = playerAnswerElement;
                            }
                            else
                            {
                                break;
                            }
                            
                            var blanksArray = dragDropBlanks.EnumerateArray().ToList();
                            var playerAnswersArray = playerAnswersElement.EnumerateArray().ToList();
                            
                            if (blanksArray.Count != playerAnswersArray.Count) return false;
                            
                            for (int i = 0; i < blanksArray.Count; i++)
                            {
                                var blank = blanksArray[i];
                                var studentAnswer = playerAnswersArray[i];
                                
                                // Get student's selected ID
                                if (!studentAnswer.TryGetProperty("selected_id", out var selectedIdElement))
                                    return false;
                                
                                var studentSelectedId = selectedIdElement.GetString()?.Trim();
                                if (string.IsNullOrEmpty(studentSelectedId))
                                    return false;
                                
                                // Check against accepted answers
                                if (blank.TryGetProperty("accepted_answers", out var acceptedAnswers))
                                {
                                    var acceptedList = acceptedAnswers.EnumerateArray()
                                        .Select(x => x.GetString()?.Trim())
                                        .ToList();
                                    
                                    if (!acceptedList.Contains(studentSelectedId))
                                    {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        }
                        break;

                    case "short_answer":
                    case "essay":
                        // These require manual grading
                        return false;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error checking answer for question type {questionType}");
                return false;
            }
        }
    }
}


