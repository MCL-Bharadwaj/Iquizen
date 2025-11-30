# Quiz API - Azure Functions

Azure Functions HTTP API for the Kids Quiz application with API key authentication, rate limiting, and Swagger documentation on a hidden path.

## Project Structure

```
Functions/
├── Endpoints/
│   └── QuizFunctions.cs         # Quiz CRUD operations
├── Swagger/
│   └── SwaggerFunction.cs       # Swagger UI on hidden path
├── Helpers/
│   ├── AuthHelper.cs            # API key validation helpers
│   └── ResponseHelper.cs        # HTTP response helpers
├── Program.cs                   # DI and startup configuration
├── host.json                    # Azure Functions configuration
├── local.settings.json          # Local development settings
└── Functions.csproj             # Project file with NuGet packages
```

## Features

✅ **RESTful API** - Quiz, Question, Attempt, Response endpoints  
✅ **API Key Authentication** - Scoped permissions with rate limiting  
✅ **Swagger/OpenAPI** - Interactive docs on hidden path  
✅ **Dependency Injection** - DbService and ApiKeyService  
✅ **Audit Logging** - Every API call logged with metadata  
✅ **Error Handling** - Consistent error responses  
✅ **CORS Support** - Configurable for web clients  

## Getting Started

### 1. Prerequisites

- .NET 8 SDK
- Azure Functions Core Tools v4
- PostgreSQL database
- Visual Studio 2022 or VS Code with Azure Functions extension

### 2. Install Dependencies

```powershell
cd Functions
dotnet restore
```

### 3. Configure Local Settings

Edit `local.settings.json`:

```json
{
  "Values": {
    "Db__ConnectionString": "Host=localhost;Database=quizdb;Username=postgres;Password=yourpassword",
    "SwaggerPath": "/internal-docs",
    "SwaggerAuthKey": "your-secret-swagger-key-change-this"
  }
}
```

### 4. Run Migrations

Execute the database migration scripts in order:

```powershell
psql -U postgres -d quizdb -f ../DatabaseScripts/000_migration_setup.sql
psql -U postgres -d quizdb -f ../DatabaseScripts/001_quizzes.sql
# ... run all migration scripts in order
psql -U postgres -d quizdb -f ../DatabaseScripts/008_api_keys.sql
```

### 5. Run Locally

```powershell
func start
```

The API will be available at `http://localhost:7071/api`

## API Endpoints

### Public Endpoints (No API Key Required)

#### Quizzes

- **GET** `/api/quizzes` - List all published quizzes
  - Query params: `?difficulty=easy&limit=50&offset=0`
  
- **GET** `/api/quizzes/{quizId}` - Get quiz by ID

### Protected Endpoints (API Key Required)

Set header: `X-API-Key: sk_live_yourkey`

#### Quizzes

- **POST** `/api/quizzes` - Create quiz (requires `quiz:write` scope)
- **PUT** `/api/quizzes/{quizId}` - Update quiz (requires `quiz:write` scope)
- **DELETE** `/api/quizzes/{quizId}` - Delete quiz (requires `quiz:delete` scope)

## Swagger Documentation

Swagger UI is available on a **hidden, protected path** to prevent discovery.

### Access Swagger UI

Navigate to:
```
http://localhost:7071/internal-docs/swagger/ui?key=your-secret-swagger-key-change-this
```

⚠️ **Security Notes:**
- The swagger path is configurable via `SwaggerPath` environment variable
- Access requires a secret key in query string or `X-Swagger-Key` header
- Change `SwaggerAuthKey` before deploying to production
- Consider using Azure AD authentication for production swagger access

### Generate OpenAPI Spec

Get the OpenAPI JSON spec:
```
http://localhost:7071/internal-docs/swagger.json?key=your-secret-swagger-key-change-this
```

## Authentication

### API Key Format

```
sk_<40_random_characters>

Example: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Test API Key (Development Only)

A test admin key is seeded in the database:

```
Plaintext: test_key_12345
Prefix: sk_test_
Scopes: All quiz and question operations
Admin: Yes
```

⚠️ **Do not use in production!**

### Create Production API Keys

Use the admin endpoints (to be created) or insert directly into the database:

```csharp
var request = new CreateApiKeyRequest
{
    Name = "Mobile App",
    Scopes = new[] { "quiz:read", "quiz:write" },
    RateLimitPerHour = 5000,
    RateLimitPerDay = 50000,
    ExpiresAt = DateTime.UtcNow.AddYears(1)
};

var response = await apiKeyService.CreateApiKeyAsync(request);
// Save response.ApiKey securely - it's only shown once!
```

## Request Examples

### Public Request (No Key)

```bash
# Get all quizzes
curl http://localhost:7071/api/quizzes

# Get specific quiz
curl http://localhost:7071/api/quizzes/123e4567-e89b-12d3-a456-426614174000
```

### Protected Request (With Key)

```bash
# Create quiz
curl -X POST http://localhost:7071/api/quizzes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_yourkey" \
  -d '{
    "title": "Math Quiz",
    "description": "Basic arithmetic",
    "slug": "math-quiz-1",
    "difficulty": "easy",
    "estimatedMinutes": 10,
    "isPublished": true,
    "tags": ["math", "kids"]
  }'

# Update quiz
curl -X PUT http://localhost:7071/api/quizzes/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_yourkey" \
  -d '{
    "title": "Updated Math Quiz",
    "isPublished": true
  }'

# Delete quiz
curl -X DELETE http://localhost:7071/api/quizzes/123e4567-e89b-12d3-a456-426614174000 \
  -H "X-API-Key: sk_live_yourkey"
```

## Response Format

### Success Response

```json
{
  "quizId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Math Quiz",
  "difficulty": "easy",
  ...
}
```

### Error Response

```json
{
  "error": "API key required in X-API-Key header"
}
```

### Rate Limited Response (429)

```json
{
  "error": "Rate limit exceeded",
  "isRateLimited": true
}
```

## Rate Limiting

Each API key has two rate limits:
- **Hourly**: Default 1000 requests/hour
- **Daily**: Default 10000 requests/day

When exceeded, returns HTTP 429 with `Retry-After` header.

## Deployment to Azure

### 1. Create Azure Resources

```powershell
# Create resource group
az group create --name quiz-api-rg --location eastus

# Create Azure Functions app
az functionapp create \
  --resource-group quiz-api-rg \
  --name quiz-api-functions \
  --storage-account quizapistorage \
  --consumption-plan-location eastus \
  --runtime dotnet-isolated \
  --functions-version 4
```

### 2. Configure App Settings

```powershell
az functionapp config appsettings set \
  --name quiz-api-functions \
  --resource-group quiz-api-rg \
  --settings \
    Db__ConnectionString="Host=yourserver.postgres.database.azure.com;..." \
    SwaggerPath="/internal-docs" \
    SwaggerAuthKey="your-production-secret-key"
```

### 3. Deploy

```powershell
func azure functionapp publish quiz-api-functions
```

### 4. Test Production Endpoint

```bash
curl https://quiz-api-functions.azurewebsites.net/api/quizzes
```

## Security Best Practices

✅ **API Keys**: Store in Azure Key Vault, not in code  
✅ **HTTPS Only**: Enforce HTTPS in production  
✅ **CORS**: Configure allowed origins  
✅ **Swagger**: Change auth key and path before deployment  
✅ **Rate Limiting**: Monitor and adjust per key  
✅ **Audit Logs**: Review api_key_audit table regularly  
✅ **Key Rotation**: Set expiration dates and rotate keys  

## Monitoring

### Application Insights

Logs are automatically sent to Application Insights if configured:

```powershell
az functionapp config appsettings set \
  --name quiz-api-functions \
  --resource-group quiz-api-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

### Query Audit Logs

```sql
-- Most active API keys
SELECT ak.name, COUNT(*) as requests
FROM api_key_audit aka
JOIN api_keys ak ON aka.api_key_id = ak.api_key_id
WHERE aka.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY ak.name
ORDER BY requests DESC;

-- Failed requests
SELECT * FROM api_key_audit
WHERE was_authorized = FALSE
ORDER BY timestamp DESC
LIMIT 100;
```

## Development

### Add New Endpoint

1. Create new function class in `Endpoints/` folder
2. Inject `IDbService` and `IApiKeyService`
3. Use `AuthHelper.ValidateApiKeyAsync()` for protected endpoints
4. Add OpenAPI attributes for Swagger documentation
5. Use `ResponseHelper` for consistent responses

### Example Template

```csharp
[Function("MyNewEndpoint")]
[OpenApiOperation(operationId: "MyOperation", tags: new[] { "MyTag" })]
public async Task<HttpResponseData> MyEndpoint(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "my-route")] HttpRequestData req)
{
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        // For protected endpoints:
        var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
            req, _apiKeyService, "my:scope", stopwatch);
        if (errorResponse != null)
            return errorResponse;
        
        // Your logic here
        
        // Log success
        await AuthHelper.LogSuccessfulUsageAsync(
            req, _apiKeyService, validation.ApiKey.ApiKeyId, 
            "my:scope", 200, stopwatch);
        
        return await ResponseHelper.OkAsync(req, result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in MyEndpoint");
        return await ResponseHelper.InternalServerErrorAsync(req);
    }
}
```

## Troubleshooting

### "Db__ConnectionString not found"
- Check `local.settings.json` exists and has the connection string
- Ensure `local.settings.json` is copied to output directory

### "API key required"
- Add `X-API-Key` header to your request
- Verify the key exists in `api_keys` table and is active

### Swagger UI not loading
- Check `SwaggerAuthKey` in settings
- Verify the URL includes `?key=your-key` parameter
- Check browser console for CORS errors

### Rate limit issues
- Check `api_key_audit` table for usage counts
- Adjust rate limits in `api_keys` table
- Clear old audit logs if needed

## Next Steps

- [ ] Add Question endpoints (GET, POST, PUT, DELETE)
- [ ] Add Attempt endpoints (start, submit, get results)
- [ ] Add Response endpoints (save answers, grade)
- [ ] Add Admin endpoints (manage API keys)
- [ ] Add CORS configuration
- [ ] Add health check endpoint
- [ ] Add metrics endpoint
- [ ] Set up CI/CD pipeline

## Dependencies

See `Functions.csproj` for full list. Key packages:

- `Microsoft.Azure.Functions.Worker` - Azure Functions runtime
- `Microsoft.Azure.WebJobs.Extensions.OpenApi` - Swagger/OpenAPI support
- `Npgsql` - PostgreSQL client
- `BCrypt.Net-Next` - Password hashing for API keys

## License

Internal use only.
