namespace Quizz.DataModel.Dtos;

/// <summary>
/// Login request model
/// </summary>
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Login response model
/// </summary>
public class LoginResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty; // JWT token
    public DateTime ExpiresAt { get; set; }
}

/// <summary>
/// Signup/Create user request model (admin only)
/// </summary>
public class SignupRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string Role { get; set; } = "player"; // player, admin
}

/// <summary>
/// Signup response model
/// </summary>
public class SignupResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// User profile model
/// </summary>
public class UserProfile
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Player DTO for management operations
/// </summary>
public class PlayerDto
{
    public Guid PlayerId { get; set; }
    public Guid UserId { get; set; }
    public string PlayerNumber { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public DateTime? GraduationDate { get; set; }
    public int TotalScore { get; set; }
    public int GamesPlayed { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // User details
    public string Username { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
}

/// <summary>
/// Create player request
/// </summary>
public class CreatePlayerRequest
{
    public Guid UserId { get; set; }
    public string PlayerNumber { get; set; } = string.Empty;
    public DateTime? EnrollmentDate { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Update player request
/// </summary>
public class UpdatePlayerRequest
{
    public string? PlayerNumber { get; set; }
    public DateTime? GraduationDate { get; set; }
    public int? TotalScore { get; set; }
    public int? GamesPlayed { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Paginated response wrapper
/// </summary>
public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

