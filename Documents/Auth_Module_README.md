# Auth Layer

This folder contains the API key authentication and authorization infrastructure for the Quiz application.

## Overview

The auth layer provides secure API key management with:
- ✅ **Bcrypt hashing** for secure key storage
- ✅ **Scope-based permissions** (e.g., `quiz:read`, `quiz:write`, `quiz:delete`)
- ✅ **Rate limiting** (hourly and daily limits per key)
- ✅ **Audit logging** for every API request
- ✅ **Admin keys** with elevated permissions
- ✅ **Key expiration** and revocation

## Files

### `Models/ApiKeyModels.cs`
Data models for API keys and validation results:
- `ApiKey` - API key entity
- `ApiKeyAudit` - Audit log entry
- `ApiKeyValidationResult` - Result of key validation
- `ApiKeyStats` - Usage statistics
- `CreateApiKeyRequest/Response` - Key creation DTOs

### `ApiKeyService.cs`
Core service for API key operations:
- `ValidateKeyAsync()` - Validates key and checks scopes/rate limits
- `CreateApiKeyAsync()` - Generates new keys with bcrypt hashing
- `RevokeApiKeyAsync()` - Deactivates a key
- `GetApiKeyStatsAsync()` - Gets usage statistics
- `LogApiKeyUsageAsync()` - Records audit logs

### `AuthServiceExtensions.cs`
Dependency injection registration:
- `AddApiKeyAuthentication()` - Registers IApiKeyService

## Database Schema

### `api_keys` Table
```sql
- api_key_id (UUID, PK)
- key_hash (TEXT) - bcrypt hash of the key
- key_prefix (TEXT) - first 8 chars for quick lookup
- name (TEXT) - human-readable name
- scopes (TEXT[]) - permission scopes
- is_admin (BOOLEAN) - admin keys bypass scope checks
- rate_limit_per_hour (INT)
- rate_limit_per_day (INT)
- is_active (BOOLEAN)
- expires_at (TIMESTAMP)
- usage_count (BIGINT)
- last_used_at (TIMESTAMP)
```

### `api_key_audit` Table
```sql
- audit_id (UUID, PK)
- api_key_id (UUID, FK)
- timestamp (TIMESTAMP)
- http_method (TEXT)
- endpoint (TEXT)
- ip_address (INET)
- status_code (INT)
- response_time_ms (INT)
- required_scope (TEXT)
- was_authorized (BOOLEAN)
- rate_limit_exceeded (BOOLEAN)
```

## Usage

### 1. Register services in Azure Functions Startup

```csharp
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;
using Quizz.DataAccess;
using Quizz.Auth;

[assembly: FunctionsStartup(typeof(Startup))]

public class Startup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
        var connString = Environment.GetEnvironmentVariable("PostgresConnectionString");
        
        // Register DbService and ApiKeyService
        builder.Services.AddDbService(connString);
        builder.Services.AddApiKeyAuthentication();
    }
}
```

### 2. Create API keys (Admin endpoint)

```csharp
public class AdminFunction
{
    private readonly IApiKeyService _apiKeyService;

    public AdminFunction(IApiKeyService apiKeyService)
    {
        _apiKeyService = apiKeyService;
    }

    [FunctionName("CreateApiKey")]
    public async Task<IActionResult> CreateKey(
        [HttpTrigger(AuthorizationLevel.Admin, "post")] HttpRequest req)
    {
        var request = new CreateApiKeyRequest
        {
            Name = "Mobile App",
            Description = "API key for iOS/Android app",
            Scopes = new[] { "quiz:read", "quiz:write", "attempt:write" },
            RateLimitPerHour = 5000,
            RateLimitPerDay = 50000,
            ExpiresAt = DateTime.UtcNow.AddYears(1)
        };

        var response = await _apiKeyService.CreateApiKeyAsync(request);
        
        // Return the key to the user - ONLY TIME IT'S VISIBLE!
        return new OkObjectResult(response);
    }
}
```

### 3. Validate keys in API endpoints

```csharp
public class QuizFunction
{
    private readonly IApiKeyService _apiKeyService;
    private readonly IDbService _dbService;

    public QuizFunction(IApiKeyService apiKeyService, IDbService dbService)
    {
        _apiKeyService = apiKeyService;
        _dbService = dbService;
    }

    [FunctionName("CreateQuiz")]
    public async Task<IActionResult> CreateQuiz(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
    {
        var startTime = DateTime.UtcNow;
        
        // Extract API key from header
        if (!req.Headers.TryGetValue("X-API-Key", out var apiKey))
        {
            return new UnauthorizedObjectResult(new { error = "API key required" });
        }

        // Validate key and check for required scope
        var validation = await _apiKeyService.ValidateKeyAsync(apiKey, "quiz:write");
        
        if (!validation.IsValid)
        {
            // Log failed attempt
            if (validation.ApiKey != null)
            {
                await _apiKeyService.LogApiKeyUsageAsync(
                    validation.ApiKey.ApiKeyId,
                    req.Method,
                    req.Path,
                    req.HttpContext.Connection.RemoteIpAddress?.ToString(),
                    req.Headers["User-Agent"],
                    401,
                    (int)(DateTime.UtcNow - startTime).TotalMilliseconds,
                    "quiz:write",
                    false,
                    validation.IsRateLimited,
                    validation.ErrorMessage
                );
            }
            
            if (validation.IsRateLimited)
            {
                return new StatusCodeResult(429); // Too Many Requests
            }
            
            return new UnauthorizedObjectResult(new { error = validation.ErrorMessage });
        }

        // Process the request
        // ... create quiz logic ...
        
        var statusCode = 201;
        var responseTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
        
        // Log successful usage
        await _apiKeyService.LogApiKeyUsageAsync(
            validation.ApiKey.ApiKeyId,
            req.Method,
            req.Path,
            req.HttpContext.Connection.RemoteIpAddress?.ToString(),
            req.Headers["User-Agent"],
            statusCode,
            responseTime,
            "quiz:write",
            true
        );

        return new CreatedResult("/api/quiz/123", new { id = "123" });
    }
}
```

## API Key Format

Generated keys follow this format:
```
sk_<40_random_characters>

Example: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- `sk_` prefix for easy identification
- 40 characters of cryptographically secure random data
- First 8 characters used as `key_prefix` for fast database lookup

## Permission Scopes

Standard scopes follow the pattern: `resource:action`

**Quiz scopes:**
- `quiz:read` - Read quiz data
- `quiz:write` - Create/update quizzes
- `quiz:delete` - Delete quizzes

**Question scopes:**
- `question:read` - Read questions
- `question:write` - Create/update questions
- `question:delete` - Delete questions

**Attempt scopes:**
- `attempt:read` - Read attempt history
- `attempt:write` - Submit quiz attempts
- `attempt:delete` - Delete attempts

**Admin scopes:**
- `admin:*` - Full admin access
- `api_key:manage` - Create/revoke API keys

**Special:**
- `is_admin = true` - Bypasses all scope checks (superuser)

## Rate Limiting

Two-tier rate limiting per key:
- **Hourly limit** - Prevents burst attacks (default: 1000 req/hour)
- **Daily limit** - Prevents sustained abuse (default: 10000 req/day)

Rate limits are checked via PostgreSQL functions:
- `is_api_key_rate_limited_hourly(key_id)`
- `is_api_key_rate_limited_daily(key_id)`

Returns HTTP 429 (Too Many Requests) when exceeded.

## Security Best Practices

### ✅ DO:
- Store API keys in environment variables, never in code
- Use HTTPS for all API requests
- Rotate keys regularly (set `expires_at`)
- Use narrow scopes (principle of least privilege)
- Log all API key usage for auditing
- Revoke compromised keys immediately
- Use different keys for different environments (dev/staging/prod)

### ❌ DON'T:
- Commit API keys to source control
- Share keys between applications
- Use keys in client-side JavaScript (use backend proxy)
- Reuse revoked keys
- Store plaintext keys in database (always hash with bcrypt)

## Testing

### Create a test key (development only):
```sql
-- This is already seeded in 008_api_keys.sql
-- Key: sk_test_admin_1234567890abcdef1234567890abcdef
-- (Use this for testing, replace in production)
```

### Test with curl:
```bash
# Public GET (no key required)
curl https://your-function-app.azurewebsites.net/api/quizzes

# Protected POST (key required)
curl -X POST https://your-function-app.azurewebsites.net/api/quizzes \
  -H "X-API-Key: sk_live_yourkey" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Quiz",...}'
```

## Monitoring

### Check key usage:
```csharp
var stats = await _apiKeyService.GetApiKeyStatsAsync(apiKeyId, days: 7);
Console.WriteLine($"Total requests: {stats.TotalRequests}");
Console.WriteLine($"Failed: {stats.FailedRequests}");
Console.WriteLine($"Rate limited: {stats.RateLimitedRequests}");
Console.WriteLine($"Avg response time: {stats.AvgResponseTimeMs}ms");
```

### Query audit logs:
```sql
-- Most active keys
SELECT ak.name, COUNT(*) as request_count
FROM api_key_audit aka
JOIN api_keys ak ON aka.api_key_id = ak.api_key_id
WHERE aka.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY ak.name
ORDER BY request_count DESC;

-- Failed authorization attempts
SELECT ak.name, aka.endpoint, aka.ip_address, aka.timestamp
FROM api_key_audit aka
JOIN api_keys ak ON aka.api_key_id = ak.api_key_id
WHERE aka.was_authorized = FALSE
ORDER BY aka.timestamp DESC
LIMIT 100;
```

## Next Steps

To complete the auth infrastructure, you'll need:

1. **KeyAuthAttribute** - Custom attribute to decorate Azure Functions
2. **Middleware** - Automatic key validation before function execution
3. **Admin endpoints** - For creating/revoking keys via API
4. **Key rotation** - Automated expiration and renewal process

Would you like me to create these components next?

## Dependencies

Required NuGet packages:
```xml
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="Npgsql" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
```
