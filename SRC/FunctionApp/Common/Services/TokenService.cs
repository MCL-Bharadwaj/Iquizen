using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Quizz.Common.Services;

/// <summary>
/// Service for generating and validating JWT tokens
/// </summary>
public class TokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationHours;

    public TokenService(string secretKey, string issuer = "LMS-API", string audience = "LMS-Users", int expirationHours = 24)
    {
        _secretKey = secretKey;
        _issuer = issuer;
        _audience = audience;
        _expirationHours = expirationHours;
    }

    /// <summary>
    /// Generate a JWT token for a user
    /// </summary>
    /// <param name="userId">User's unique identifier</param>
    /// <param name="email">User's email</param>
    /// <param name="roles">User's roles</param>
    /// <returns>JWT token string</returns>
    public string GenerateToken(Guid userId, string email, List<string> roles)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", userId.ToString())
        };

        // Add roles as claims using simple "role" claim type
        foreach (var role in roles)
        {
            claims.Add(new Claim("role", role));
        }

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Validate a JWT token and extract the user ID
    /// </summary>
    /// <param name="token">JWT token string</param>
    /// <returns>User ID if valid, null otherwise</returns>
    public Guid? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userIdClaim = jwtToken.Claims.First(x => x.Type == "userId").Value;

            return Guid.Parse(userIdClaim);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Validate a JWT token and extract user ID and roles
    /// </summary>
    /// <param name="token">JWT token string</param>
    /// <returns>Tuple of (UserId, Roles) if valid, (null, empty list) otherwise</returns>
    public (Guid? UserId, List<string> Roles) ValidateTokenWithRoles(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userIdClaim = jwtToken.Claims.First(x => x.Type == "userId").Value;
            var userId = Guid.Parse(userIdClaim);

            // Extract all role claims
            var roles = jwtToken.Claims
                .Where(x => x.Type == "role")
                .Select(x => x.Value)
                .ToList();

            return (userId, roles);
        }
        catch
        {
            return (null, new List<string>());
        }
    }
}


