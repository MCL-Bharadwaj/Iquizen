namespace Quizz.Configuration;

public sealed class DbOptions
{
    public string? ConnectionString { get; set; }
}

public sealed class JwtOptions
{
    public string? SecretKey { get; set; }
    public string? Issuer { get; set; }
    public string? Audience { get; set; }
    public int ExpirationHours { get; set; } = 24;
}

public sealed class CorsOptions
{
    public string? AllowedOrigins { get; set; }
}

public sealed class OpenApiOptions
{
    public string? Title { get; set; }
    public string? Version { get; set; }
    public string? Description { get; set; }
}


