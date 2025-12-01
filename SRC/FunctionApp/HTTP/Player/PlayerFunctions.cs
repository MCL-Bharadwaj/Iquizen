using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Quizz.Common.Extensions;
using Quizz.Common.Services;
using Quizz.DataAccess;
using Quizz.DataModel.Dtos;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;
using System.Net;
using Npgsql;

namespace Quizz.Functions.Player;

/// <summary>
/// Azure Functions for managing players - Complete CRUD operations
/// Only accessible by: Administrator, Tutors, Player (for own data)
/// </summary>
public class PlayerFunctions
{
    private readonly ILogger<PlayerFunctions> _logger;
    private readonly IDbService _dbService;
    private readonly AuthorizationService _authService;

    public PlayerFunctions(
        ILogger<PlayerFunctions> logger,
        IDbService dbService,
        AuthorizationService authService)
    {
        _logger = logger;
        _dbService = dbService;
        _authService = authService;
    }

    /// <summary>
    /// Get all players
    /// GET /api/players
    /// Requires: Administrator role
    /// </summary>
    [Function("GetAllPlayers")]
    [OpenApiOperation(operationId: "GetAllPlayers", tags: new[] { "players" }, Summary = "Get all players", Description = "Get paginated list of all players (Admin only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "page", In = ParameterLocation.Query, Required = false, Type = typeof(int), Description = "Page number (default: 1)")]
    [OpenApiParameter(name: "pageSize", In = ParameterLocation.Query, Required = false, Type = typeof(int), Description = "Page size (default: 20)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(PaginatedResponse<PlayerDto>), Description = "Paginated list of players")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetAllPlayers(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players")] HttpRequestData req)
    {
        _logger.LogInformation("Getting all players");

        try
        {
            // Validate token and authorize (Administrator only)
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            // Get query parameters
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var page = int.TryParse(query["page"], out var p) ? p : 1;
            var pageSize = int.TryParse(query["pageSize"], out var ps) ? ps : 20;
            var offset = (page - 1) * pageSize;

            await using var conn = await _dbService.GetConnectionAsync();

            // Get total count
            var countSql = @"SELECT COUNT(*) FROM quiz.players p 
                            INNER JOIN lms.users u ON p.user_id = u.user_id 
                            WHERE p.deleted_at IS NULL";
            await using var countCmd = new NpgsqlCommand(countSql, conn);
            var totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

            // Get paginated data
            var sql = @"
                SELECT 
                    p.player_id,
                    p.user_id,
                    p.player_number,
                    p.enrollment_date,
                    p.graduation_date,
                    p.total_score,
                    p.games_played,
                    p.is_active,
                    u.email,
                    u.first_name,
                    u.last_name
                FROM quiz.players p
                INNER JOIN lms.users u ON p.user_id = u.user_id
                WHERE p.deleted_at IS NULL
                ORDER BY p.created_at DESC
                LIMIT @pageSize OFFSET @offset";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("pageSize", pageSize);
            cmd.Parameters.AddWithValue("offset", offset);

            var players = new List<PlayerDto>();
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                players.Add(new PlayerDto
                {
                    PlayerId = reader.GetGuid(0),
                    UserId = reader.GetGuid(1),
                    PlayerNumber = reader.GetString(2),
                    EnrollmentDate = reader.GetDateTime(3),
                    GraduationDate = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                    TotalScore = reader.GetInt32(5),
                    GamesPlayed = reader.GetInt32(6),
                    IsActive = reader.GetBoolean(7),
                    Username = reader.GetString(8), // Using email as username
                    FullName = $"{reader.GetString(9)} {reader.GetString(10)}".Trim(), // Combining first_name and last_name
                    Email = reader.GetString(8)
                });
            }

            var response = new PaginatedResponse<PlayerDto>
            {
                Data = players,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return await req.OkAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting players");
            return await req.InternalServerErrorAsync("Error getting players");
        }
    }

    /// <summary>
    /// Get player by ID
    /// GET /api/players/{id}
    /// Requires: Administrator or Player (own profile)
    /// </summary>
    [Function("GetPlayerById")]
    [OpenApiOperation(operationId: "GetPlayerById", tags: new[] { "players" }, Summary = "Get player by ID", Description = "Get player details by ID (Admin or own profile)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "id", In = ParameterLocation.Path, Required = true, Type = typeof(Guid), Description = "Player ID")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(PlayerDto), Description = "Player details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Player not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetPlayerById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/{id}")] HttpRequestData req,
        Guid id)
    {
        try
        {
            // Validate token and authorize
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator", "Player");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            await using var conn = await _dbService.GetConnectionAsync();

            var sql = @"
                SELECT 
                    p.player_id,
                    p.user_id,
                    p.player_number,
                    p.enrollment_date,
                    p.graduation_date,
                    p.total_score,
                    p.games_played,
                    p.is_active,
                    u.email,
                    u.first_name,
                    u.last_name
                FROM quiz.players p
                INNER JOIN lms.users u ON p.user_id = u.user_id
                WHERE p.player_id = @playerId AND p.deleted_at IS NULL";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("playerId", id);

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return await req.NotFoundAsync("Player not found");
            }

            var playerUserId = reader.GetGuid(1);

            // Check authorization: admin can see all, player can only see own profile
            if (!authResult.HasAnyRole("Administrator") && authResult.UserId != playerUserId)
            {
                return await req.UnauthorizedAsync("Access denied");
            }

            var player = new PlayerDto
            {
                PlayerId = reader.GetGuid(0),
                UserId = playerUserId,
                PlayerNumber = reader.GetString(2),
                EnrollmentDate = reader.GetDateTime(3),
                GraduationDate = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                TotalScore = reader.GetInt32(5),
                GamesPlayed = reader.GetInt32(6),
                IsActive = reader.GetBoolean(7),
                Username = reader.GetString(8), // Using email as username
                FullName = $"{reader.GetString(9)} {reader.GetString(10)}".Trim(), // Combining first_name and last_name
                Email = reader.GetString(8)
            };

            return await req.OkAsync(player);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting player by ID");
            return await req.InternalServerErrorAsync("Error getting player by ID");
        }
    }

    /// <summary>
    /// Create new player
    /// POST /api/players
    /// Requires: Administrator role
    /// </summary>
    [Function("CreatePlayer")]
    [OpenApiOperation(operationId: "CreatePlayer", tags: new[] { "players" }, Summary = "Create player", Description = "Create a new player (Admin only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(CreatePlayerRequest), Required = true, Description = "Player details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Created, contentType: "application/json", bodyType: typeof(PlayerDto), Description = "Player created")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.BadRequest, contentType: "application/json", bodyType: typeof(object), Description = "Invalid request")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Admin access required")]
    public async Task<HttpResponseData> CreatePlayer(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "players")] HttpRequestData req)
    {
        try
        {
            // Validate token and authorize (Administrator only)
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var request = await req.ReadFromJsonAsync<CreatePlayerRequest>();
            if (request == null)
            {
                return await req.BadRequestAsync("Invalid request body");
            }

            await using var conn = await _dbService.GetConnectionAsync();

            // Check if user exists
            var userCheckSql = "SELECT COUNT(*) FROM lms.users WHERE user_id = @userId AND is_active = TRUE";
            await using var userCheckCmd = new NpgsqlCommand(userCheckSql, conn);
            userCheckCmd.Parameters.AddWithValue("userId", request.UserId);
            var userExists = Convert.ToInt32(await userCheckCmd.ExecuteScalarAsync()) > 0;

            if (!userExists)
            {
                return await req.BadRequestAsync("User not found");
            }

            // Check if player already exists for this user
            var playerCheckSql = "SELECT COUNT(*) FROM quiz.players WHERE user_id = @userId AND deleted_at IS NULL";
            await using var playerCheckCmd = new NpgsqlCommand(playerCheckSql, conn);
            playerCheckCmd.Parameters.AddWithValue("userId", request.UserId);
            var playerExists = Convert.ToInt32(await playerCheckCmd.ExecuteScalarAsync()) > 0;

            if (playerExists)
            {
                return await req.BadRequestAsync("Player already exists for this user");
            }

            var sql = @"
                INSERT INTO quiz.players (player_id, user_id, player_number, enrollment_date, is_active)
                VALUES (gen_random_uuid(), @userId, @playerNumber, @enrollmentDate, @isActive)
                RETURNING player_id, user_id, player_number, enrollment_date, graduation_date, total_score, games_played, is_active";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("userId", request.UserId);
            cmd.Parameters.AddWithValue("playerNumber", request.PlayerNumber);
            cmd.Parameters.AddWithValue("enrollmentDate", request.EnrollmentDate ?? DateTime.UtcNow);
            cmd.Parameters.AddWithValue("isActive", request.IsActive);

            await using var reader = await cmd.ExecuteReaderAsync();
            await reader.ReadAsync();

            var player = new PlayerDto
            {
                PlayerId = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                PlayerNumber = reader.GetString(2),
                EnrollmentDate = reader.GetDateTime(3),
                GraduationDate = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                TotalScore = reader.GetInt32(5),
                GamesPlayed = reader.GetInt32(6),
                IsActive = reader.GetBoolean(7)
            };

            return await req.CreatedAsync(player);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating player");
            return await req.InternalServerErrorAsync("Error creating player");
        }
    }

    /// <summary>
    /// Update player
    /// PUT /api/players/{id}
    /// Requires: Administrator role
    /// </summary>
    [Function("UpdatePlayer")]
    [OpenApiOperation(operationId: "UpdatePlayer", tags: new[] { "players" }, Summary = "Update player", Description = "Update player details (Admin only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "id", In = ParameterLocation.Path, Required = true, Type = typeof(Guid), Description = "Player ID")]
    [OpenApiRequestBody(contentType: "application/json", bodyType: typeof(UpdatePlayerRequest), Required = true, Description = "Updated player details")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(PlayerDto), Description = "Player updated")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Player not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Admin access required")]
    public async Task<HttpResponseData> UpdatePlayer(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "players/{id}")] HttpRequestData req,
        Guid id)
    {
        try
        {
            // Validate token and authorize (Administrator only)
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var request = await req.ReadFromJsonAsync<UpdatePlayerRequest>();
            if (request == null)
            {
                return await req.BadRequestAsync("Invalid request body");
            }

            await using var conn = await _dbService.GetConnectionAsync();

            // Check if player exists
            var checkSql = "SELECT COUNT(*) FROM quiz.players WHERE player_id = @playerId AND deleted_at IS NULL";
            await using var checkCmd = new NpgsqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("playerId", id);
            var exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync()) > 0;

            if (!exists)
            {
                return await req.NotFoundAsync("Player not found");
            }

            var sql = @"
                UPDATE quiz.players
                SET 
                    player_number = COALESCE(@playerNumber, player_number),
                    graduation_date = COALESCE(@graduationDate, graduation_date),
                    total_score = COALESCE(@totalScore, total_score),
                    games_played = COALESCE(@gamesPlayed, games_played),
                    is_active = COALESCE(@isActive, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE player_id = @playerId
                RETURNING player_id, user_id, player_number, enrollment_date, graduation_date, total_score, games_played, is_active";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("playerId", id);
            cmd.Parameters.AddWithValue("playerNumber", (object?)request.PlayerNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("graduationDate", (object?)request.GraduationDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("totalScore", (object?)request.TotalScore ?? DBNull.Value);
            cmd.Parameters.AddWithValue("gamesPlayed", (object?)request.GamesPlayed ?? DBNull.Value);
            cmd.Parameters.AddWithValue("isActive", (object?)request.IsActive ?? DBNull.Value);

            await using var reader = await cmd.ExecuteReaderAsync();
            await reader.ReadAsync();

            var player = new PlayerDto
            {
                PlayerId = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                PlayerNumber = reader.GetString(2),
                EnrollmentDate = reader.GetDateTime(3),
                GraduationDate = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                TotalScore = reader.GetInt32(5),
                GamesPlayed = reader.GetInt32(6),
                IsActive = reader.GetBoolean(7)
            };

            return await req.OkAsync(player);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating player");
            return await req.InternalServerErrorAsync("Error updating player");
        }
    }

    /// <summary>
    /// Delete player (soft delete)
    /// DELETE /api/players/{id}
    /// Requires: Administrator role
    /// </summary>
    [Function("DeletePlayer")]
    [OpenApiOperation(operationId: "DeletePlayer", tags: new[] { "players" }, Summary = "Delete player", Description = "Soft delete a player (Admin only)")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "id", In = ParameterLocation.Path, Required = true, Type = typeof(Guid), Description = "Player ID")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NoContent, contentType: "application/json", bodyType: typeof(void), Description = "Player deleted")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "Player not found")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Admin access required")]
    public async Task<HttpResponseData> DeletePlayer(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "players/{id}")] HttpRequestData req,
        Guid id)
    {
        try
        {
            // Validate token and authorize (Administrator only)
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            await using var conn = await _dbService.GetConnectionAsync();

            var sql = @"
                UPDATE quiz.players
                SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE player_id = @playerId AND deleted_at IS NULL
                RETURNING player_id";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("playerId", id);

            var result = await cmd.ExecuteScalarAsync();

            if (result == null)
            {
                return await req.NotFoundAsync("Player not found");
            }

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting player");
            return await req.InternalServerErrorAsync("Error deleting player");
        }
    }

    /// <summary>
    /// Get all quizzes for a specific player
    /// GET /api/player/quizzes
    /// Requires: Player or Administrator role
    /// </summary>
    [Function("GetPlayerQuizzes")]
    [OpenApiOperation(operationId: "GetPlayerQuizzes", tags: new[] { "players" }, Summary = "Get player's quizzes", Description = "Get all quizzes for a player")]
    [OpenApiSecurity("bearer_auth", SecuritySchemeType.Http, Scheme = OpenApiSecuritySchemeType.Bearer, BearerFormat = "JWT")]
    [OpenApiParameter(name: "playerId", In = ParameterLocation.Query, Required = false, Type = typeof(Guid), Description = "Player ID (defaults to current user's player)")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(List<object>), Description = "List of quizzes")]
    [OpenApiResponseWithBody(statusCode: HttpStatusCode.Unauthorized, contentType: "application/json", bodyType: typeof(object), Description = "Authentication required")]
    public async Task<HttpResponseData> GetPlayerQuizzes(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "player/quizzes")] HttpRequestData req)
    {
        try
        {
            // Validate token and authorize
            var authResult = await _authService.ValidateAndAuthorizeAsync(req, "Player", "Administrator");
            if (!authResult.IsAuthorized)
                return authResult.ErrorResponse!;

            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var playerIdParam = query["playerId"];
            Guid? playerId = null;
            if (!string.IsNullOrEmpty(playerIdParam) && Guid.TryParse(playerIdParam, out var parsedPlayerId))
            {
                playerId = parsedPlayerId;
            }

            await using var conn = await _dbService.GetConnectionAsync();

            // If playerId is provided, verify the player exists and belongs to the current user
            if (playerId.HasValue)
            {
                var playerCheckSql = @"
                    SELECT user_id FROM quiz.players 
                    WHERE player_id = @playerId AND deleted_at IS NULL";
                
                await using var checkCmd = new NpgsqlCommand(playerCheckSql, conn);
                checkCmd.Parameters.AddWithValue("playerId", playerId.Value);
                
                var playerUserId = await checkCmd.ExecuteScalarAsync();
                if (playerUserId == null)
                {
                    return await req.NotFoundAsync("Player not found");
                }
                
                if (!playerUserId.Equals(authResult.UserId!))
                {
                    return await req.UnauthorizedAsync("Access denied");
                }
            }

            var sql = @"
                SELECT 
                    q.quiz_id,
                    q.title,
                    q.description,
                    q.difficulty,
                    q.estimated_minutes,
                    q.subject,
                    COUNT(DISTINCT qq.question_id) as question_count,
                    MAX(a.started_at) as last_attempt_at,
                    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.attempt_id END) as completed_attempts
                FROM quiz.quizzes q
                LEFT JOIN quiz.quiz_questions qq ON q.quiz_id = qq.quiz_id
                LEFT JOIN quiz.attempts a ON q.quiz_id = a.quiz_id AND a.user_id = @userId
                WHERE q.deleted_at IS NULL
                GROUP BY q.quiz_id, q.title, q.description, q.difficulty, q.estimated_minutes, q.subject
                ORDER BY q.created_at DESC";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("userId", authResult.UserId!);

            var quizzes = new List<object>();
            await using var reader = await cmd.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                quizzes.Add(new
                {
                    quizId = reader.GetGuid(0),
                    title = reader.GetString(1),
                    description = reader.IsDBNull(2) ? null : reader.GetString(2),
                    difficulty = reader.IsDBNull(3) ? null : reader.GetString(3),
                    estimatedMinutes = reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4),
                    subject = reader.IsDBNull(5) ? null : reader.GetString(5),
                    questionCount = Convert.ToInt32(reader.GetInt64(6)),
                    lastAttemptAt = reader.IsDBNull(7) ? (DateTime?)null : reader.GetDateTime(7),
                    completedAttempts = Convert.ToInt32(reader.GetInt64(8))
                });
            }

            return await req.OkAsync(quizzes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting player quizzes");
            return await req.InternalServerErrorAsync("Error getting player quizzes");
        }
    }
}