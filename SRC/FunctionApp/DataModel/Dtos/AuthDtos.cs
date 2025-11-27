namespace Quizz.DataModel.Dtos;

/// <summary>
/// DTO for user registration
/// </summary>
public class UserRegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
}

/// <summary>
/// DTO for user login
/// </summary>
public class UserLoginDto
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}

/// <summary>
/// DTO for authentication response (login/register)
/// </summary>
public class AuthResponseDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// DTO for password change
/// </summary>
public class ChangePasswordDto
{
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}

/// <summary>
/// DTO for forgot password request
/// </summary>
public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// DTO for password reset
/// </summary>
public class ResetPasswordDto
{
    public string? Email { get; set; }
    public string? Token { get; set; }
    public string? NewPassword { get; set; }
}

/// <summary>
/// DTO for email verification
/// </summary>
public class VerifyEmailDto
{
    public string? Email { get; set; }
    public string? Token { get; set; }
}


