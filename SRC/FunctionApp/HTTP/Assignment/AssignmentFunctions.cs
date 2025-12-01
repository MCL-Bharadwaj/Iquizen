using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Quizz.Common.Extensions;
using Quizz.Common.Services;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using System.Text.Json;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;
using System.Net;
using Npgsql;

namespace Quizz.HTTP.Assignment;

/// <summary>
/// Azure Functions for managing quiz assignments
/// Only accessible by: Administrator, Tutors, Content Creator roles
/// </summary>
public class AssignmentFunctions
{
    private readonly ILogger<AssignmentFunctions> _logger;
    private readonly IDbService _dbService;
    private readonly AuthorizationService _authService;

    public AssignmentFunctions(
        ILogger<AssignmentFunctions> logger,
        IDbService dbService,
        AuthorizationService authService)
    {
        _logger = logger;
        _dbService = dbService;
        _authService = authService;
    }

    /// <summary>
    /// Create a new quiz assignment
    /// POST /api/assignments
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("CreateAssignment")]
    [OpenApiOperation(operationId: "CreateAssignment", tags: new[] { "assignments" }, Summary = "Create quiz assignment", Description = "Create a new quiz assignment for a user (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(CreateAssignmentRequest), Required = true, Description = "Assignment details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Created, contentType: "application/json", bodyType: typeof(AssignmentResponse), Description = "Assignment created successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.BadRequest, contentType: "application/json", bodyType: typeof(object), Description = "Invalid request data")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Forbidden, contentType: "application/json", bodyType: typeof(object), Description = "Insufficient permissions")]
    public async Task<HttpResponseData> CreateAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assignments")]
        HttpRequestData req)
    {
        _logger.LogInformation("Creating new quiz assignment");

        try
        {
            // Validate token and authorize (Administrator, Tutors, or Content Creator)
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            // Parse request body
            var assignment = await req.ReadFromJsonAsync<CreateAssignmentRequest>();
            if (assignment == null)
                return await req.BadRequestAsync("Invalid assignment data");

            // Validate required fields
            if (assignment.QuizId == Guid.Empty)
                return await req.BadRequestAsync("QuizId is required");

            if (string.IsNullOrWhiteSpace(assignment.UserId))
                return await req.BadRequestAsync("UserId is required");

            // Create assignment in database
            var sql = @"
                INSERT INTO quiz.quiz_assignments (
                    quiz_id, user_id, assigned_by, due_date, 
                    max_attempts, is_mandatory, notes, metadata
                )
                VALUES (
                    @QuizId, @UserId::uuid, @AssignedBy, @DueDate,
                    @MaxAttempts, @IsMandatory, @Notes, @Metadata::jsonb
                )
                RETURNING 
                    assignment_id, quiz_id, user_id, assigned_by,
                    assigned_at, due_date, status, max_attempts,
                    attempts_used, is_mandatory, notes, 
                    created_at, updated_at";

            var parameters = new
            {
                assignment.QuizId,
                assignment.UserId,
                AssignedBy = authResult.UserId.ToString(),
                assignment.DueDate,
                assignment.MaxAttempts,
                assignment.IsMandatory,
                assignment.Notes,
                Metadata = assignment.Metadata != null 
                    ? JsonSerializer.Serialize(assignment.Metadata) 
                    : null
            };

            var npgsqlParams = new[]
            {
                new NpgsqlParameter("@QuizId", assignment.QuizId),
                new NpgsqlParameter("@UserId", assignment.UserId),
                new NpgsqlParameter("@AssignedBy", authResult.UserId.ToString()),
                new NpgsqlParameter("@DueDate", (object?)assignment.DueDate ?? DBNull.Value),
                new NpgsqlParameter("@MaxAttempts", (object?)assignment.MaxAttempts ?? DBNull.Value),
                new NpgsqlParameter("@IsMandatory", assignment.IsMandatory),
                new NpgsqlParameter("@Notes", (object?)assignment.Notes ?? DBNull.Value),
                new NpgsqlParameter("@Metadata", assignment.Metadata != null ? JsonSerializer.Serialize(assignment.Metadata) : DBNull.Value)
            };
            
            var reader = await _dbService.ExecuteQueryAsync(sql, npgsqlParams);
            
            if (!await reader.ReadAsync())
            {
                await reader.DisposeAsync();
                return await req.ServerErrorAsync("Failed to create assignment");
            }

            var assignmentId = reader.GetGuid(reader.GetOrdinal("assignment_id"));
            var quizId = reader.GetGuid(reader.GetOrdinal("quiz_id"));
            var userId = reader.GetGuid(reader.GetOrdinal("user_id")).ToString();
            var assignedBy = reader.IsDBNull(reader.GetOrdinal("assigned_by")) ? null : reader.GetString(reader.GetOrdinal("assigned_by"));
            var assignedAt = reader.GetDateTime(reader.GetOrdinal("assigned_at"));
            var dueDate = reader.IsDBNull(reader.GetOrdinal("due_date")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("due_date"));
            var status = reader.GetString(reader.GetOrdinal("status"));
            var maxAttempts = reader.IsDBNull(reader.GetOrdinal("max_attempts")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("max_attempts"));
            var attemptsUsed = reader.GetInt32(reader.GetOrdinal("attempts_used"));
            var isMandatory = reader.GetBoolean(reader.GetOrdinal("is_mandatory"));
            var notes = reader.IsDBNull(reader.GetOrdinal("notes")) ? null : reader.GetString(reader.GetOrdinal("notes"));
            var createdAt = reader.GetDateTime(reader.GetOrdinal("created_at"));
            var updatedAt = reader.GetDateTime(reader.GetOrdinal("updated_at"));
            
            await reader.DisposeAsync();

            // Get quiz details
            var quizSql = "SELECT title, description, subject, difficulty, estimated_minutes FROM quiz.quizzes WHERE quiz_id = @QuizId";
            var quizParams = new[] { new NpgsqlParameter("@QuizId", assignment.QuizId) };
            var quizReader = await _dbService.ExecuteQueryAsync(quizSql, quizParams);
            
            string quizTitle = "";
            string? quizDescription = null;
            string? subject = null;
            string? difficulty = null;
            int? estimatedMinutes = null;
            
            if (await quizReader.ReadAsync())
            {
                quizTitle = quizReader.GetString(0);
                quizDescription = quizReader.IsDBNull(1) ? null : quizReader.GetString(1);
                subject = quizReader.IsDBNull(2) ? null : quizReader.GetString(2);
                difficulty = quizReader.IsDBNull(3) ? null : quizReader.GetString(3);
                estimatedMinutes = quizReader.IsDBNull(4) ? (int?)null : quizReader.GetInt32(4);
            }
            await quizReader.DisposeAsync();

            var response = new AssignmentResponse
            {
                AssignmentId = assignmentId,
                QuizId = quizId,
                QuizTitle = quizTitle,
                QuizDescription = quizDescription,
                Subject = subject,
                Difficulty = difficulty,
                EstimatedMinutes = estimatedMinutes,
                UserId = userId,
                AssignedBy = assignedBy,
                AssignedAt = assignedAt,
                DueDate = dueDate,
                Status = status,
                MaxAttempts = maxAttempts,
                AttemptsUsed = attemptsUsed,
                IsMandatory = isMandatory,
                Notes = notes,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };

            _logger.LogInformation("Assignment created successfully: {AssignmentId}", response.AssignmentId);
            return await req.CreatedAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment");
            return await req.ServerErrorAsync($"Error creating assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Create multiple assignments (bulk assign)
    /// POST /api/assignments/bulk
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("BulkCreateAssignments")]
    [OpenApiOperation(operationId: "BulkCreateAssignments", tags: new[] { "assignments" }, Summary = "Bulk create assignments", Description = "Create multiple quiz assignments at once (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(BulkAssignmentRequest), Required = true, Description = "Bulk assignment details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Created, contentType: "application/json", bodyType: typeof(BulkAssignmentResponse), Description = "Assignments created successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Forbidden, contentType: "application/json", bodyType: typeof(object), Description = "Insufficient permissions")]
    public async Task<HttpResponseData> BulkCreateAssignments(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assignments/bulk")]
        HttpRequestData req)
    {
        _logger.LogInformation("Creating bulk quiz assignments");

        try
        {
            // Validate token and authorize
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            // Parse request body
            var bulkRequest = await req.ReadFromJsonAsync<BulkAssignmentRequest>();
            if (bulkRequest == null || !bulkRequest.UserIds.Any())
                return await req.BadRequestAsync("Invalid bulk assignment data or empty user list");

            var response = new BulkAssignmentResponse();
            var createdAssignments = new List<AssignmentResponse>();
            var errors = new List<string>();

            // Get quiz details once
            var quizSql = "SELECT title, description, subject, difficulty, estimated_minutes FROM quiz.quizzes WHERE quiz_id = @QuizId";
            var quizDetails = await _dbService.QuerySingleAsync<dynamic>(quizSql, new { bulkRequest.QuizId });

            if (quizDetails == null)
                return await req.BadRequestAsync("Quiz not found");

            foreach (var userId in bulkRequest.UserIds)
            {
                try
                {
                    var sql = @"
                        INSERT INTO quiz.quiz_assignments (
                            quiz_id, user_id, assigned_by, due_date, 
                            max_attempts, is_mandatory, notes, metadata
                        )
                        VALUES (
                            @QuizId, @UserId, @AssignedBy, @DueDate,
                            @MaxAttempts, @IsMandatory, @Notes, @Metadata::jsonb
                        )
                        RETURNING 
                            assignment_id, quiz_id, user_id, assigned_by,
                            assigned_at, due_date, status, max_attempts,
                            attempts_used, is_mandatory, notes, 
                            created_at, updated_at";

                    var parameters = new
                    {
                        bulkRequest.QuizId,
                        UserId = userId,
                        AssignedBy = authResult.UserId.ToString(),
                        bulkRequest.DueDate,
                        bulkRequest.MaxAttempts,
                        bulkRequest.IsMandatory,
                        bulkRequest.Notes,
                        Metadata = bulkRequest.Metadata != null 
                            ? JsonSerializer.Serialize(bulkRequest.Metadata) 
                            : null
                    };

                    var result = await _dbService.QuerySingleAsync<dynamic>(sql, parameters);

                    if (result != null)
                    {
                        createdAssignments.Add(new AssignmentResponse
                        {
                            AssignmentId = result.assignment_id,
                            QuizId = result.quiz_id,
                            QuizTitle = quizDetails.title,
                            QuizDescription = quizDetails.description,
                            Subject = quizDetails.subject,
                            Difficulty = quizDetails.difficulty,
                            EstimatedMinutes = quizDetails.estimated_minutes,
                            UserId = result.user_id,
                            AssignedBy = result.assigned_by,
                            AssignedAt = result.assigned_at,
                            DueDate = result.due_date,
                            Status = result.status,
                            MaxAttempts = result.max_attempts,
                            AttemptsUsed = result.attempts_used,
                            IsMandatory = result.is_mandatory,
                            Notes = result.notes,
                            CreatedAt = result.created_at,
                            UpdatedAt = result.updated_at
                        });
                        response.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Failed to assign to user {userId}: {ex.Message}");
                    response.FailureCount++;
                    _logger.LogWarning(ex, "Failed to create assignment for user {UserId}", userId);
                }
            }

            response.CreatedAssignments = createdAssignments;
            response.Errors = errors;

            _logger.LogInformation("Bulk assignment completed: {SuccessCount} succeeded, {FailureCount} failed", 
                response.SuccessCount, response.FailureCount);

            return await req.OkAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating bulk assignments");
            return await req.ServerErrorAsync($"Error creating bulk assignments: {ex.Message}");
        }
    }

    /// <summary>
    /// Get all assignments (with optional filters)
    /// GET /api/assignments?userId={userId}&quizId={quizId}&status={status}
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("GetAssignments")]
    [OpenApiOperation(operationId: "GetAssignments", tags: new[] { "assignments" }, Summary = "Get all assignments", Description = "Get filtered list of assignments (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "userId", In = ParameterLocation.Query, Required = false, Type = typeof(string), Description = "Filter by user ID")]
    [OpenApiParameter(name: "quizId", In = ParameterLocation.Query, Required = false, Type = typeof(string), Description = "Filter by quiz ID")]
    [OpenApiParameter(name: "status", In = ParameterLocation.Query, Required = false, Type = typeof(string), Description = "Filter by status (pending/in_progress/completed/cancelled)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(List<AssignmentResponse>), Description = "List of assignments")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetAssignments(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "assignments")]
        HttpRequestData req)
    {
        _logger.LogInformation("Getting assignments");

        try
        {
            // Validate token and authorize
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            // Get query parameters
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var userId = query["userId"];
            var quizId = query["quizId"];
            var status = query["status"];

            // Build SQL query with filters
            var sql = @"
                SELECT 
                    qa.assignment_id,
                    qa.quiz_id,
                    q.title as quiz_title,
                    q.description as quiz_description,
                    q.subject,
                    q.difficulty,
                    q.estimated_minutes,
                    qa.user_id,
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    u.email as user_email,
                    qa.assigned_by,
                    ab.first_name as assigned_by_first_name,
                    ab.last_name as assigned_by_last_name,
                    qa.assigned_at,
                    qa.due_date,
                    qa.status,
                    qa.started_at,
                    qa.completed_at,
                    qa.score,
                    qa.max_attempts,
                    qa.is_mandatory,
                    qa.notes
                FROM quiz.quiz_assignments qa
                INNER JOIN quiz.quizzes q ON qa.quiz_id = q.quiz_id
                INNER JOIN lms.users u ON qa.user_id = u.user_id
                LEFT JOIN lms.users ab ON qa.assigned_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                    AND qa.assigned_by::uuid = ab.user_id
                WHERE 1=1";
            var conditions = new List<string>();
            object parameters = new { }; // Initialize with empty object instead of null

            if (!string.IsNullOrEmpty(userId))
            {
                conditions.Add("qa.user_id = @UserId");
                if (!string.IsNullOrEmpty(quizId) && Guid.TryParse(quizId, out var quizGuid))
                {
                    conditions.Add("qa.quiz_id = @QuizId");
                    if (!string.IsNullOrEmpty(status))
                    {
                        conditions.Add("qa.status = @Status");
                        parameters = new { UserId = userId, QuizId = quizGuid, Status = status };
                    }
                    else
                    {
                        parameters = new { UserId = userId, QuizId = quizGuid };
                    }
                }
                else if (!string.IsNullOrEmpty(status))
                {
                    conditions.Add("qa.status = @Status");
                    parameters = new { UserId = userId, Status = status };
                }
                else
                {
                    parameters = new { UserId = userId };
                }
            }
            else if (!string.IsNullOrEmpty(quizId) && Guid.TryParse(quizId, out var quizGuid))
            {
                conditions.Add("qa.quiz_id = @QuizId");
                if (!string.IsNullOrEmpty(status))
                {
                    conditions.Add("qa.status = @Status");
                    parameters = new { QuizId = quizGuid, Status = status };
                }
                else
                {
                    parameters = new { QuizId = quizGuid };
                }
            }
            else if (!string.IsNullOrEmpty(status))
            {
                conditions.Add("qa.status = @Status");
                parameters = new { Status = status };
            }

            if (conditions.Any())
                sql += " AND " + string.Join(" AND ", conditions);

            sql += " ORDER BY qa.assigned_at DESC";

            await using var conn = await _dbService.GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(sql, conn);
            
            // Add parameters
            if (!string.IsNullOrEmpty(userId))
            {
                cmd.Parameters.AddWithValue("UserId", userId);
                if (!string.IsNullOrEmpty(quizId) && Guid.TryParse(quizId, out var quizGuid))
                {
                    cmd.Parameters.AddWithValue("QuizId", quizGuid);
                    if (!string.IsNullOrEmpty(status))
                    {
                        cmd.Parameters.AddWithValue("Status", status);
                    }
                }
                else if (!string.IsNullOrEmpty(status))
                {
                    cmd.Parameters.AddWithValue("Status", status);
                }
            }
            else if (!string.IsNullOrEmpty(quizId) && Guid.TryParse(quizId, out var qGuid))
            {
                cmd.Parameters.AddWithValue("QuizId", qGuid);
                if (!string.IsNullOrEmpty(status))
                {
                    cmd.Parameters.AddWithValue("Status", status);
                }
            }
            else if (!string.IsNullOrEmpty(status))
            {
                cmd.Parameters.AddWithValue("Status", status);
            }

            var assignments = new List<AssignmentResponse>();
            await using var reader = await cmd.ExecuteReaderAsync();

            // Pre-calculate ordinals for better readability and performance
            var assignmentIdOrdinal = reader.GetOrdinal("assignment_id");
            var quizIdOrdinal = reader.GetOrdinal("quiz_id");
            var quizTitleOrdinal = reader.GetOrdinal("quiz_title");
            var quizDescriptionOrdinal = reader.GetOrdinal("quiz_description");
            var subjectOrdinal = reader.GetOrdinal("subject");
            var difficultyOrdinal = reader.GetOrdinal("difficulty");
            var estimatedMinutesOrdinal = reader.GetOrdinal("estimated_minutes");
            var userIdOrdinal = reader.GetOrdinal("user_id");
            var userFirstNameOrdinal = reader.GetOrdinal("user_first_name");
            var userLastNameOrdinal = reader.GetOrdinal("user_last_name");
            var userEmailOrdinal = reader.GetOrdinal("user_email");
            var assignedByOrdinal = reader.GetOrdinal("assigned_by");
            var assignedByFirstNameOrdinal = reader.GetOrdinal("assigned_by_first_name");
            var assignedByLastNameOrdinal = reader.GetOrdinal("assigned_by_last_name");
            var assignedAtOrdinal = reader.GetOrdinal("assigned_at");
            var dueDateOrdinal = reader.GetOrdinal("due_date");
            var statusOrdinal = reader.GetOrdinal("status");
            var startedAtOrdinal = reader.GetOrdinal("started_at");
            var completedAtOrdinal = reader.GetOrdinal("completed_at");
            var scoreOrdinal = reader.GetOrdinal("score");
            var maxAttemptsOrdinal = reader.GetOrdinal("max_attempts");
            var isMandatoryOrdinal = reader.GetOrdinal("is_mandatory");
            var notesOrdinal = reader.GetOrdinal("notes");

            while (await reader.ReadAsync())
            {
                assignments.Add(new AssignmentResponse
                {
                    AssignmentId = reader.GetGuid(assignmentIdOrdinal),
                    QuizId = reader.GetGuid(quizIdOrdinal),
                    QuizTitle = reader.GetString(quizTitleOrdinal),
                    QuizDescription = reader.IsDBNull(quizDescriptionOrdinal) ? null : reader.GetString(quizDescriptionOrdinal),
                    Subject = reader.IsDBNull(subjectOrdinal) ? null : reader.GetString(subjectOrdinal),
                    Difficulty = reader.IsDBNull(difficultyOrdinal) ? null : reader.GetString(difficultyOrdinal),
                    EstimatedMinutes = reader.IsDBNull(estimatedMinutesOrdinal) ? null : reader.GetInt32(estimatedMinutesOrdinal),
                    UserId = reader.GetGuid(userIdOrdinal).ToString(),
                    UserFirstName = reader.IsDBNull(userFirstNameOrdinal) ? null : reader.GetString(userFirstNameOrdinal),
                    UserLastName = reader.IsDBNull(userLastNameOrdinal) ? null : reader.GetString(userLastNameOrdinal),
                    UserEmail = reader.IsDBNull(userEmailOrdinal) ? null : reader.GetString(userEmailOrdinal),
                    AssignedBy = reader.IsDBNull(assignedByOrdinal) ? null : reader.GetString(assignedByOrdinal),
                    AssignedByFirstName = reader.IsDBNull(assignedByFirstNameOrdinal) ? null : reader.GetString(assignedByFirstNameOrdinal),
                    AssignedByLastName = reader.IsDBNull(assignedByLastNameOrdinal) ? null : reader.GetString(assignedByLastNameOrdinal),
                    AssignedAt = reader.GetDateTime(assignedAtOrdinal),
                    DueDate = reader.IsDBNull(dueDateOrdinal) ? null : reader.GetDateTime(dueDateOrdinal),
                    Status = reader.GetString(statusOrdinal),
                    StartedAt = reader.IsDBNull(startedAtOrdinal) ? null : reader.GetDateTime(startedAtOrdinal),
                    CompletedAt = reader.IsDBNull(completedAtOrdinal) ? null : reader.GetDateTime(completedAtOrdinal),
                    Score = reader.IsDBNull(scoreOrdinal) ? null : reader.GetDecimal(scoreOrdinal),
                    MaxAttempts = reader.IsDBNull(maxAttemptsOrdinal) ? null : reader.GetInt32(maxAttemptsOrdinal),
                    AttemptsUsed = 0, // This would need to be calculated from attempts table if needed
                    IsMandatory = reader.GetBoolean(isMandatoryOrdinal),
                    Notes = reader.IsDBNull(notesOrdinal) ? null : reader.GetString(notesOrdinal),
                    CreatedAt = reader.GetDateTime(assignedAtOrdinal), // Using assigned_at as created_at
                    UpdatedAt = reader.GetDateTime(assignedAtOrdinal) // Using assigned_at as updated_at for now
                });
            }

            return await req.OkAsync(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignments");
            return await req.ServerErrorAsync($"Error getting assignments: {ex.Message}");
        }
    }

    /// <summary>
    /// Get assignments for current user (player view)
    /// GET /api/my-assignments
    /// Requires: Any authenticated user
    /// </summary>
    [Function("GetMyAssignments")]
    [OpenApiOperation(operationId: "GetMyAssignments", tags: new[] { "assignments" }, Summary = "Get my assignments", Description = "Get all assignments for the authenticated user")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(List<AssignmentResponse>), Description = "User's assignments")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetMyAssignments(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "my-assignments")]
        HttpRequestData req)
    {
        _logger.LogInformation("Getting user's assignments");

        try
        {
            // Validate token (any authenticated user)
            var authResult = await _authService.ValidateTokenAsync(req);

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var userId = authResult.UserId.ToString();
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var status = query["status"];

            // Query assignments with quiz details using JOIN
            var sql = @"
                SELECT 
                    qa.assignment_id, qa.quiz_id, qa.user_id, qa.assigned_by,
                    qa.assigned_at, qa.due_date, qa.status, qa.started_at, qa.completed_at,
                    qa.score, qa.max_attempts, qa.attempts_used, qa.is_mandatory, qa.notes,
                    qa.created_at, qa.updated_at,
                    q.title as quiz_title, q.description as quiz_description,
                    q.subject, q.difficulty, q.estimated_minutes
                FROM quiz.quiz_assignments qa
                LEFT JOIN quiz.quizzes q ON qa.quiz_id = q.quiz_id
                WHERE qa.user_id = @UserId::uuid";
            
            if (!string.IsNullOrEmpty(status))
                sql += " AND qa.status = @Status";
            
            sql += " ORDER BY qa.assigned_at DESC";

            var npgsqlParams = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@UserId", userId)
            };

            if (!string.IsNullOrEmpty(status))
            {
                npgsqlParams.Add(new NpgsqlParameter("@Status", status));
            }

            var reader = await _dbService.ExecuteQueryAsync(sql, npgsqlParams.ToArray());
            var response = new List<AssignmentResponse>();

            while (await reader.ReadAsync())
            {
                response.Add(new AssignmentResponse
                {
                    AssignmentId = reader.GetGuid(reader.GetOrdinal("assignment_id")),
                    QuizId = reader.GetGuid(reader.GetOrdinal("quiz_id")),
                    QuizTitle = reader.IsDBNull(reader.GetOrdinal("quiz_title")) ? "" : reader.GetString(reader.GetOrdinal("quiz_title")),
                    QuizDescription = reader.IsDBNull(reader.GetOrdinal("quiz_description")) ? null : reader.GetString(reader.GetOrdinal("quiz_description")),
                    Subject = reader.IsDBNull(reader.GetOrdinal("subject")) ? null : reader.GetString(reader.GetOrdinal("subject")),
                    Difficulty = reader.IsDBNull(reader.GetOrdinal("difficulty")) ? null : reader.GetString(reader.GetOrdinal("difficulty")),
                    EstimatedMinutes = reader.IsDBNull(reader.GetOrdinal("estimated_minutes")) ? null : reader.GetInt32(reader.GetOrdinal("estimated_minutes")),
                    UserId = reader.GetGuid(reader.GetOrdinal("user_id")).ToString(),
                    AssignedBy = reader.IsDBNull(reader.GetOrdinal("assigned_by")) ? null : reader.GetString(reader.GetOrdinal("assigned_by")),
                    AssignedAt = reader.GetDateTime(reader.GetOrdinal("assigned_at")),
                    DueDate = reader.IsDBNull(reader.GetOrdinal("due_date")) ? null : reader.GetDateTime(reader.GetOrdinal("due_date")),
                    Status = reader.GetString(reader.GetOrdinal("status")),
                    StartedAt = reader.IsDBNull(reader.GetOrdinal("started_at")) ? null : reader.GetDateTime(reader.GetOrdinal("started_at")),
                    CompletedAt = reader.IsDBNull(reader.GetOrdinal("completed_at")) ? null : reader.GetDateTime(reader.GetOrdinal("completed_at")),
                    Score = reader.IsDBNull(reader.GetOrdinal("score")) ? null : reader.GetDecimal(reader.GetOrdinal("score")),
                    MaxAttempts = reader.IsDBNull(reader.GetOrdinal("max_attempts")) ? null : reader.GetInt32(reader.GetOrdinal("max_attempts")),
                    AttemptsUsed = reader.GetInt32(reader.GetOrdinal("attempts_used")),
                    IsMandatory = reader.GetBoolean(reader.GetOrdinal("is_mandatory")),
                    Notes = reader.IsDBNull(reader.GetOrdinal("notes")) ? null : reader.GetString(reader.GetOrdinal("notes"))
                });
            }

            await reader.DisposeAsync();

            return await req.OkAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user assignments");
            return await req.ServerErrorAsync($"Error getting user assignments: {ex.Message}");
        }
    }

    /// <summary>
    /// Get specific assignment details
    /// GET /api/assignments/{assignmentId}
    /// Requires: Any authenticated user (own assignment) or Administrator/Tutors/Content Creator
    /// </summary>
    [Function("GetAssignment")]
    [OpenApiOperation(operationId: "GetAssignment", tags: new[] { "assignments" }, Summary = "Get assignment by ID", Description = "Get detailed information about a specific assignment")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "assignmentId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Assignment ID (GUID)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(AssignmentResponse), Description = "Assignment details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Assignment not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "assignments/{assignmentId}")]
        HttpRequestData req,
        string assignmentId)
    {
        _logger.LogInformation("Getting assignment {AssignmentId}", assignmentId);

        try
        {
            // Validate token
            var authResult = await _authService.ValidateTokenAsync(req);

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(assignmentId, out var assignmentGuid))
                return await req.BadRequestAsync("Invalid assignment ID");

            var sql = "SELECT * FROM quiz.v_user_assignments WHERE assignment_id = @AssignmentId";
            var assignment = await _dbService.QuerySingleAsync<dynamic>(sql, new { AssignmentId = assignmentGuid });

            if (assignment == null)
                return await req.NotFoundAsync("Assignment not found");

            // Check authorization: user can see their own assignment, or admin/tutor can see all
            var isOwner = assignment.user_id == authResult.UserId.ToString();
            var hasAdminAccess = authResult.HasAnyRole("Administrator", "Tutors", "Content Creator");

            if (!isOwner && !hasAdminAccess)
                return await req.ForbiddenAsync("You do not have permission to view this assignment");

            var response = new AssignmentResponse
            {
                AssignmentId = assignment.assignment_id,
                QuizId = assignment.quiz_id,
                QuizTitle = assignment.quiz_title ?? "",
                QuizDescription = assignment.quiz_description,
                Subject = assignment.subject,
                Difficulty = assignment.difficulty,
                EstimatedMinutes = assignment.estimated_minutes,
                UserId = assignment.user_id,
                AssignedBy = assignment.assigned_by,
                AssignedAt = assignment.assigned_at,
                DueDate = assignment.due_date,
                Status = assignment.status,
                StartedAt = assignment.started_at,
                CompletedAt = assignment.completed_at,
                Score = assignment.score,
                MaxAttempts = assignment.max_attempts,
                AttemptsUsed = assignment.attempts_used,
                IsMandatory = assignment.is_mandatory,
                Notes = assignment.notes,
                HoursUntilDue = assignment.hours_until_due,
                CompletionTimeMinutes = assignment.completion_time_minutes
            };

            return await req.OkAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignment");
            return await req.ServerErrorAsync($"Error getting assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Update assignment details
    /// PUT /api/assignments/{assignmentId}
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("UpdateAssignment")]
    [OpenApiOperation(operationId: "UpdateAssignment", tags: new[] { "assignments" }, Summary = "Update assignment", Description = "Update assignment details like due date, max attempts (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "assignmentId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Assignment ID (GUID)")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(UpdateAssignmentRequest), Required = true, Description = "Updated assignment details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(AssignmentResponse), Description = "Assignment updated successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Assignment not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> UpdateAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "assignments/{assignmentId}")]
        HttpRequestData req,
        string assignmentId)
    {
        _logger.LogInformation("Updating assignment {AssignmentId}", assignmentId);

        try
        {
            // Validate token and authorize
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(assignmentId, out var assignmentGuid))
                return await req.BadRequestAsync("Invalid assignment ID");

            var updateRequest = await req.ReadFromJsonAsync<UpdateAssignmentRequest>();
            if (updateRequest == null)
                return await req.BadRequestAsync("Invalid update data");

            // Build dynamic update query
            var setClauses = new List<string>();
            var parameterValues = new List<(string key, object value)> { ("AssignmentId", assignmentGuid) };

            if (updateRequest.DueDate.HasValue)
            {
                setClauses.Add("due_date = @DueDate");
                parameterValues.Add(("DueDate", updateRequest.DueDate.Value));
            }

            if (updateRequest.MaxAttempts.HasValue)
            {
                setClauses.Add("max_attempts = @MaxAttempts");
                parameterValues.Add(("MaxAttempts", updateRequest.MaxAttempts.Value));
            }

            if (updateRequest.IsMandatory.HasValue)
            {
                setClauses.Add("is_mandatory = @IsMandatory");
                parameterValues.Add(("IsMandatory", updateRequest.IsMandatory.Value));
            }

            if (updateRequest.Notes != null)
            {
                setClauses.Add("notes = @Notes");
                parameterValues.Add(("Notes", updateRequest.Notes));
            }

            if (!string.IsNullOrEmpty(updateRequest.Status))
            {
                setClauses.Add("status = @Status");
                parameterValues.Add(("Status", updateRequest.Status));
            }

            if (!setClauses.Any())
                return await req.BadRequestAsync("No fields to update");

            var sql = $@"
                UPDATE quiz.quiz_assignments 
                SET {string.Join(", ", setClauses)}
                WHERE assignment_id = @AssignmentId
                RETURNING assignment_id";

            // Create anonymous object for parameters
            var parameters = parameterValues.ToDictionary(p => p.key, p => p.value);
            var result = await _dbService.QuerySingleAsync<dynamic>(sql, parameters);

            if (result == null)
                return await req.NotFoundAsync("Assignment not found");

            _logger.LogInformation("Assignment {AssignmentId} updated successfully", assignmentId);
            return await req.OkAsync(new { message = "Assignment updated successfully", assignmentId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment");
            return await req.ServerErrorAsync($"Error updating assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Start an assignment (player action)
    /// POST /api/assignments/{assignmentId}/start
    /// Requires: Any authenticated user (must be owner)
    /// </summary>
    [Function("StartAssignment")]
    [OpenApiOperation(operationId: "StartAssignment", tags: new[] { "assignments" }, Summary = "Start assignment", Description = "Mark assignment as in progress and create an attempt")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "assignmentId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Assignment ID (GUID)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(AssignmentResponse), Description = "Assignment started successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.BadRequest, contentType: "application/json", bodyType: typeof(object), Description = "Invalid request or max attempts reached")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> StartAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assignments/{assignmentId}/start")]
        HttpRequestData req,
        string assignmentId)
    {
        _logger.LogInformation("Starting assignment {AssignmentId}", assignmentId);

        try
        {
            var authResult = await _authService.ValidateTokenAsync(req);

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(assignmentId, out var assignmentGuid))
                return await req.BadRequestAsync("Invalid assignment ID");

            // Check if user owns this assignment
            var checkSql = "SELECT user_id, status, max_attempts, attempts_used FROM quiz.quiz_assignments WHERE assignment_id = @AssignmentId";
            var assignment = await _dbService.QuerySingleAsync<dynamic>(checkSql, new { AssignmentId = assignmentGuid });

            if (assignment == null)
                return await req.NotFoundAsync("Assignment not found");

            if (assignment.user_id != authResult.UserId.ToString())
                return await req.ForbiddenAsync("You can only start your own assignments");

            // Check if max attempts reached
            if (assignment.max_attempts != null && assignment.attempts_used >= assignment.max_attempts)
                return await req.BadRequestAsync("Maximum attempts reached for this assignment");

            // Update to in_progress and increment attempts
            var sql = @"
                UPDATE quiz.quiz_assignments 
                SET status = 'in_progress',
                    started_at = COALESCE(started_at, NOW()),
                    attempts_used = attempts_used + 1
                WHERE assignment_id = @AssignmentId
                RETURNING assignment_id, status, started_at, attempts_used";

            var result = await _dbService.QuerySingleAsync<dynamic>(sql, new { AssignmentId = assignmentGuid });

            if (result == null)
                return await req.ServerErrorAsync("Failed to start assignment");

            return await req.OkAsync(new 
            { 
                message = "Assignment started successfully",
                assignmentId = result.assignment_id,
                status = result.status,
                startedAt = result.started_at,
                attemptsUsed = result.attempts_used
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting assignment");
            return await req.ServerErrorAsync($"Error starting assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Complete an assignment with score
    /// POST /api/assignments/{assignmentId}/complete
    /// Requires: Any authenticated user (must be owner)
    /// </summary>
    [Function("CompleteAssignment")]
    [OpenApiOperation(operationId: "CompleteAssignment", tags: new[] { "assignments" }, Summary = "Complete assignment", Description = "Mark assignment as completed with score")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "assignmentId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Assignment ID (GUID)")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(CompleteAssignmentRequest), Required = true, Description = "Completion details with score")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(AssignmentResponse), Description = "Assignment completed successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.BadRequest, contentType: "application/json", bodyType: typeof(object), Description = "Invalid request")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> CompleteAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assignments/{assignmentId}/complete")]
        HttpRequestData req,
        string assignmentId)
    {
        _logger.LogInformation("Completing assignment {AssignmentId}", assignmentId);

        try
        {
            var authResult = await _authService.ValidateTokenAsync(req);

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(assignmentId, out var assignmentGuid))
                return await req.BadRequestAsync("Invalid assignment ID");

            var completeRequest = await req.ReadFromJsonAsync<CompleteAssignmentRequest>();
            if (completeRequest == null)
                return await req.BadRequestAsync("Score is required");

            // Check if user owns this assignment
            var checkSql = "SELECT user_id FROM quiz.quiz_assignments WHERE assignment_id = @AssignmentId";
            var assignment = await _dbService.QuerySingleAsync<dynamic>(checkSql, new { AssignmentId = assignmentGuid });

            if (assignment == null)
                return await req.NotFoundAsync("Assignment not found");

            if (assignment.user_id != authResult.UserId.ToString())
                return await req.ForbiddenAsync("You can only complete your own assignments");

            // Update to completed with score
            var sql = @"
                UPDATE quiz.quiz_assignments 
                SET status = 'completed',
                    completed_at = NOW(),
                    score = @Score
                WHERE assignment_id = @AssignmentId
                RETURNING assignment_id, status, completed_at, score";

            var result = await _dbService.QuerySingleAsync<dynamic>(sql, new 
            { 
                AssignmentId = assignmentGuid,
                Score = completeRequest.Score
            });

            if (result == null)
                return await req.ServerErrorAsync("Failed to complete assignment");

            return await req.OkAsync(new 
            { 
                message = "Assignment completed successfully",
                assignmentId = result.assignment_id,
                status = result.status,
                completedAt = result.completed_at,
                score = result.score
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing assignment");
            return await req.ServerErrorAsync($"Error completing assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Cancel an assignment
    /// DELETE /api/assignments/{assignmentId}
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("CancelAssignment")]
    [OpenApiOperation(operationId: "CancelAssignment", tags: new[] { "assignments" }, Summary = "Cancel assignment", Description = "Cancel an assignment (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "assignmentId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Assignment ID (GUID)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(object), Description = "Assignment cancelled successfully")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Assignment not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> CancelAssignment(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "assignments/{assignmentId}")]
        HttpRequestData req,
        string assignmentId)
    {
        _logger.LogInformation("Cancelling assignment {AssignmentId}", assignmentId);

        try
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(assignmentId, out var assignmentGuid))
                return await req.BadRequestAsync("Invalid assignment ID");

            var sql = @"
                UPDATE quiz.quiz_assignments 
                SET status = 'cancelled'
                WHERE assignment_id = @AssignmentId
                RETURNING assignment_id";

            var result = await _dbService.QuerySingleAsync<dynamic>(sql, new { AssignmentId = assignmentGuid });

            if (result == null)
                return await req.NotFoundAsync("Assignment not found");

            _logger.LogInformation("Assignment {AssignmentId} cancelled", assignmentId);
            return await req.OkAsync(new { message = "Assignment cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling assignment");
            return await req.ServerErrorAsync($"Error cancelling assignment: {ex.Message}");
        }
    }

    /// <summary>
    /// Get assignment statistics for a quiz
    /// GET /api/assignments/stats/{quizId}
    /// Requires: Administrator, Tutors, or Content Creator role
    /// </summary>
    [Function("GetAssignmentStats")]
    [OpenApiOperation(operationId: "GetAssignmentStats", tags: new[] { "assignments" }, Summary = "Get assignment statistics", Description = "Get statistics for all assignments of a specific quiz (Admin, Tutors, Content Creator only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "quizId", In = ParameterLocation.Path, Required = true, Type = typeof(string), Description = "Quiz ID (GUID)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(AssignmentStatsResponse), Description = "Assignment statistics")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetAssignmentStats(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "assignments/stats/{quizId}")]
        HttpRequestData req,
        string quizId)
    {
        _logger.LogInformation("Getting assignment stats for quiz {QuizId}", quizId);

        try
        {
            var authResult = await _authService.ValidateAndAuthorizeAsync(
                req, "Administrator", "Tutors", "Content Creator");

            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            if (!Guid.TryParse(quizId, out var quizGuid))
                return await req.BadRequestAsync("Invalid quiz ID");

            var sql = "SELECT * FROM quiz.v_assignment_stats WHERE quiz_id = @QuizId";
            var stats = await _dbService.QuerySingleAsync<dynamic>(sql, new { QuizId = quizGuid });

            if (stats == null)
                return await req.NotFoundAsync("No assignment statistics found for this quiz");

            var response = new AssignmentStatsResponse
            {
                QuizId = stats.quiz_id,
                TotalAssignments = stats.total_assignments,
                AssignedCount = stats.assigned_count,
                InProgressCount = stats.in_progress_count,
                CompletedCount = stats.completed_count,
                OverdueCount = stats.overdue_count,
                CancelledCount = stats.cancelled_count,
                AverageScore = stats.avg_score,
                AverageCompletionMinutes = stats.avg_completion_minutes,
                MandatoryCount = stats.mandatory_count
            };

            return await req.OkAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignment stats");
            return await req.ServerErrorAsync($"Error getting assignment stats: {ex.Message}");
        }
    }
}
