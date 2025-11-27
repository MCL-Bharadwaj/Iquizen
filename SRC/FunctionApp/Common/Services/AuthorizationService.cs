using System.Net;
using Microsoft.Azure.Functions.Worker.Http;
using Quizz.Common.Extensions;

namespace Quizz.Common.Services;

/// <summary>
/// Result of authorization check
/// </summary>
public class AuthResult
{
    public Guid? UserId { get; set; }
    public List<string> Roles { get; set; } = new();
    public HttpResponseData? ErrorResponse { get; set; }
    
    /// <summary>
    /// True if authorization was successful (no error response)
    /// </summary>
    public bool IsAuthorized => ErrorResponse == null && UserId.HasValue;
    
    /// <summary>
    /// Check if user has Administrator role
    /// </summary>
    public bool IsAdministrator => Roles.Contains("Administrator", StringComparer.OrdinalIgnoreCase) 
        || Roles.Contains("admin", StringComparer.OrdinalIgnoreCase);
    
    /// <summary>
    /// Check if user has Player role
    /// </summary>
    public bool IsPlayer => Roles.Contains("player", StringComparer.OrdinalIgnoreCase);
    
    /// <summary>
    /// Check if user has any of the specified roles
    /// </summary>
    public bool HasAnyRole(params string[] requiredRoles)
    {
        return requiredRoles.Any(required => Roles.Contains(required, StringComparer.OrdinalIgnoreCase));
    }
    
    /// <summary>
    /// Check if user has all of the specified roles
    /// </summary>
    public bool HasAllRoles(params string[] requiredRoles)
    {
        return requiredRoles.All(required => Roles.Contains(required, StringComparer.OrdinalIgnoreCase));
    }
}

/// <summary>
/// Service for handling JWT token validation and authorization
/// </summary>
public class AuthorizationService
{
    private readonly TokenService _tokenService;

    public AuthorizationService(TokenService tokenService)
    {
        _tokenService = tokenService;
    }

    /// <summary>
    /// Validate JWT token and check if user has any of the required roles
    /// </summary>
    /// <param name="req">HTTP request with Authorization header</param>
    /// <param name="requiredRoles">Required role names (user must have at least one)</param>
    /// <returns>AuthResult with user info and authorization status</returns>
    public async Task<AuthResult> ValidateAndAuthorizeAsync(HttpRequestData req, params string[] requiredRoles)
    {
        // First, validate the token
        var authResult = await ValidateTokenAsync(req);
        
        if (!authResult.IsAuthorized)
            return authResult;

        // If no roles required, just return the validated result
        if (requiredRoles == null || requiredRoles.Length == 0)
            return authResult;

        // Check if user has any of the required roles
        if (!authResult.HasAnyRole(requiredRoles))
        {
            authResult.ErrorResponse = await req.ForbiddenAsync(
                $"This operation requires one of the following roles: {string.Join(", ", requiredRoles)}"
            );
        }

        return authResult;
    }

    /// <summary>
    /// Validate JWT token without role checking
    /// </summary>
    /// <param name="req">HTTP request with Authorization header</param>
    /// <returns>AuthResult with user info and validation status</returns>
    public async Task<AuthResult> ValidateTokenAsync(HttpRequestData req)
    {
        var result = new AuthResult();

        // Extract token from Authorization header
        if (!req.Headers.TryGetValues("Authorization", out var authHeaders))
        {
            result.ErrorResponse = await req.UnauthorizedAsync("Authorization header is required");
            return result;
        }

        var authHeader = authHeaders.FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            result.ErrorResponse = await req.UnauthorizedAsync("Bearer token is required");
            return result;
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();
        if (string.IsNullOrEmpty(token))
        {
            result.ErrorResponse = await req.UnauthorizedAsync("Token is empty");
            return result;
        }

        // Validate token and extract userId and roles from token claims
        var (userId, roles) = _tokenService.ValidateTokenWithRoles(token);
        if (userId == null)
        {
            result.ErrorResponse = await req.UnauthorizedAsync("Invalid or expired token");
            return result;
        }

        result.UserId = userId;
        result.Roles = roles;
        return result;
    }

    /// <summary>
    /// Validate token and require ALL specified roles
    /// </summary>
    public async Task<AuthResult> ValidateAndRequireAllRolesAsync(HttpRequestData req, params string[] requiredRoles)
    {
        var authResult = await ValidateTokenAsync(req);
        
        if (!authResult.IsAuthorized)
            return authResult;

        if (requiredRoles == null || requiredRoles.Length == 0)
            return authResult;

        if (!authResult.HasAllRoles(requiredRoles))
        {
            authResult.ErrorResponse = await req.ForbiddenAsync(
                $"This operation requires all of the following roles: {string.Join(", ", requiredRoles)}"
            );
        }

        return authResult;
    }
}


