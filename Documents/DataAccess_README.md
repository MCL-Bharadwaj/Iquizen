# DataAccess Layer

This folder contains the PostgreSQL database service implementation for the Quiz application.

## Files

### `DbService.cs`
Core database service class that handles all interactions with PostgreSQL using Npgsql.

**Key Features:**
- Connection management with automatic open/close
- Transaction support via `ExecuteInTransactionAsync<T>()`
- CRUD operations for all tables (quizzes, questions, attempts, responses, content, audit_log)
- JSONB serialization/deserialization for question content and metadata
- Parameterized queries to prevent SQL injection
- Soft delete support for quizzes and questions
- Audit logging capabilities

**Usage in Azure Functions:**
```csharp
public class MyFunction
{
    private readonly DbService _dbService;

    public MyFunction(DbService dbService)
    {
        _dbService = dbService;
    }

    [FunctionName("GetQuiz")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req,
        Guid quizId)
    {
        using var reader = await _dbService.GetQuizByIdAsync(quizId);
        if (await reader.ReadAsync())
        {
            // Process quiz data
        }
        return new OkObjectResult(/* result */);
    }
}
```

### `DbServiceExtensions.cs`
Extension methods for registering DbService with dependency injection.

**Usage in Azure Functions Startup:**
```csharp
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;
using Quizz.DataAccess;

[assembly: FunctionsStartup(typeof(Startup))]

public class Startup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
        var connectionString = Environment.GetEnvironmentVariable("Db__ConnectionString");
        builder.Services.AddDbService(connectionString);
    }
}
```

## Design Decisions

### 1. **NpgsqlDataReader vs. Materialized Objects**
The service returns `NpgsqlDataReader` instances instead of fully materialized objects. This provides:
- **Performance**: Streaming data without loading everything into memory
- **Flexibility**: Caller decides what data to extract
- **Control**: Can be easily wrapped with helper methods for specific use cases

To convert to your DataModel objects, you'll create extension methods or helper mappers in the next phase.

### 2. **Scoped Lifetime**
The service is registered as `Scoped` (not Singleton or Transient) because:
- Azure Functions creates a new scope per invocation
- Connection is reused within a single function execution
- Automatic disposal at end of function invocation

### 3. **Connection Management**
- Connection is lazy-initialized on first use
- Kept open for the lifetime of the service instance
- Automatically disposed via `IDisposable`
- Single connection per service instance (no connection pooling needed - Npgsql handles this internally)

### 4. **JSONB Handling**
- Uses `System.Text.Json` for serialization (modern, fast, built-in)
- Consistent camelCase naming for JSON properties
- Cast to `::jsonb` in SQL ensures proper type handling
- Deserialize JSONB columns in calling code using your QuestionTypes classes

### 5. **Transaction Support**
- `ExecuteInTransactionAsync<T>()` provides explicit transaction control
- Auto-rollback on exceptions
- Use for multi-step operations (e.g., create quiz + add questions + log audit)

### 6. **Soft Deletes**
- `deleted_at` column allows "undo" functionality
- Queries automatically filter out deleted records with `WHERE deleted_at IS NULL`
- Physical deletes can be done via background job if needed

## Operations by Table

### Quizzes
- ✅ `GetQuizByIdAsync(quizId)` - single quiz
- ✅ `GetPublishedQuizzesAsync(difficulty, tags, limit, offset)` - filtered list
- ✅ `CreateQuizAsync(...)` - returns new quiz_id
- ✅ `UpdateQuizAsync(quizId, ...)` - partial updates
- ✅ `DeleteQuizAsync(quizId)` - soft delete

### Questions
- ✅ `GetQuestionByIdAsync(questionId)` - single question with JSONB content
- ✅ `GetQuestionsByQuizIdAsync(quizId)` - all questions for a quiz (ordered)
- ✅ `CreateQuestionAsync(type, content, points, ...)` - returns new question_id
- ✅ `UpdateQuestionAsync(questionId, ...)` - partial updates
- ✅ `DeleteQuestionAsync(questionId)` - soft delete

### Quiz-Question Junction
- ✅ `AddQuestionToQuizAsync(quizId, questionId, displayOrder)` - upsert
- ✅ `RemoveQuestionFromQuizAsync(quizId, questionId)` - hard delete

### Attempts
- ✅ `GetAttemptByIdAsync(attemptId)` - single attempt
- ✅ `GetAttemptsByUserIdAsync(userId, limit)` - user's attempt history
- ✅ `CreateAttemptAsync(quizId, userId, metadata)` - returns new attempt_id
- ✅ `UpdateAttemptAsync(attemptId, status, scores, ...)` - partial updates

### Responses
- ✅ `GetResponsesByAttemptIdAsync(attemptId)` - all responses for an attempt
- ✅ `UpsertResponseAsync(attemptId, questionId, answerPayload, ...)` - create or update response

### Content
- ✅ `GetContentAsync(contentKey, contentType)` - localized content lookup
- ✅ `UpsertContentAsync(contentKey, contentType, translations, metadata)` - create or update

### Audit Log
- ✅ `LogAuditAsync(eventType, actorType, actorId, ...)` - create audit entry
- ✅ `GetAuditLogsAsync(eventType, resourceType, resourceId, limit)` - filtered logs

### Raw SQL (escape hatch)
- ✅ `ExecuteQueryAsync(sql, parameters)` - raw SELECT queries
- ✅ `ExecuteNonQueryAsync(sql, parameters)` - raw INSERT/UPDATE/DELETE

## Next Steps

1. **Create Repository Pattern (Optional)**
   - Wrap DbService with higher-level repositories if you want full object materialization
   - Example: `QuizRepository` that returns `Quiz` API models instead of readers

2. **Add Mapping Extensions**
   - Create extension methods on `NpgsqlDataReader` to convert to your DataModel types
   - Example: `reader.ToQuizDocument()`, `reader.ToQuestionDocument()`

3. **Add Validation**
   - Input validation in service methods (or use FluentValidation)
   - Business rule validation before database operations

4. **Add Caching**
   - Redis or in-memory cache for frequently accessed quizzes
   - Cache invalidation on updates

5. **Add Health Checks**
   - Test database connectivity on startup
   - Expose health endpoint for monitoring

## Environment Variables

Configure the following in your Azure Functions Application Settings:

```
Db__ConnectionString=Host=myserver.postgres.database.azure.com;Database=quizdb;Username=dbuser;Password=***;SSL Mode=Require;Trust Server Certificate=true
```

For local development, add to `local.settings.json`:
```json
{
  "Values": {
    "Db__ConnectionString": "Host=localhost;Database=quizdb;Username=postgres;Password=***"
  }
}
```

## Dependencies

Add to your `.csproj`:
```xml
<PackageReference Include="Npgsql" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
```

For Azure Functions:
```xml
<PackageReference Include="Microsoft.Azure.Functions.Extensions" Version="1.1.0" />
<PackageReference Include="Microsoft.NET.Sdk.Functions" Version="4.4.0" />
```

## Testing

Example unit test structure (use your preferred testing framework):

```csharp
public class DbServiceTests
{
    private readonly string _testConnectionString = "Host=localhost;Database=quizdb_test;...";

    [Fact]
    public async Task CreateQuiz_ShouldReturnValidGuid()
    {
        using var dbService = new DbService(_testConnectionString);
        
        var quizId = await dbService.CreateQuizAsync(
            title: "Test Quiz",
            description: "Test Description",
            slug: "test-quiz",
            difficulty: "easy",
            estimatedMinutes: 10
        );
        
        Assert.NotEqual(Guid.Empty, quizId);
    }
}
```

## Performance Tips

1. **Use indexes**: All queries leverage the indexes defined in the migration scripts
2. **Limit result sets**: Always use `LIMIT` for list queries
3. **Batch operations**: Use transactions for multi-step operations
4. **Connection pooling**: Npgsql handles this automatically (default pool size: 100)
5. **Read-only queries**: Consider read replicas for heavy read workloads in production

## Security

- ✅ Parameterized queries prevent SQL injection
- ✅ No raw string concatenation in SQL
- ✅ Connection string stored in environment variables (not code)
- ⚠️ Add row-level security (RLS) in PostgreSQL for multi-tenant isolation if needed
- ⚠️ Add authentication/authorization checks in Azure Functions before calling DbService

## Error Handling

DbService methods throw exceptions on failure:
- `NpgsqlException` - database errors (connection, constraint violations, etc.)
- `InvalidOperationException` - invalid state (e.g., reader already closed)
- `ArgumentNullException` - missing required parameters

Azure Functions should catch and handle these appropriately:

```csharp
try
{
    var quizId = await _dbService.CreateQuizAsync(...);
    return new OkObjectResult(new { quizId });
}
catch (NpgsqlException ex) when (ex.SqlState == "23505") // unique violation
{
    return new ConflictObjectResult("Quiz with this slug already exists");
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to create quiz");
    return new StatusCodeResult(500);
}
```
