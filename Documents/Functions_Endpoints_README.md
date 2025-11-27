# Quiz API Endpoints

This folder contains all HTTP endpoint functions organized by resource and operation type.

## Organization Structure

Endpoints are organized into subfolders by **resource/context** with separate files for **read** and **write** operations.

**All endpoints use models from `DataModel.ApiModels`** - there are NO separate model files in endpoint folders to avoid duplication.

```
Endpoints/
├── Quiz/
│   ├── QuizReadFunctions.cs    # GET operations (public) - uses DataModel.ApiModels
│   └── QuizWriteFunctions.cs   # POST/PUT/DELETE (API key required) - uses DataModel.ApiModels
├── Question/
│   ├── QuestionReadFunctions.cs   # Uses DataModel.ApiModels
│   └── QuestionWriteFunctions.cs  # Uses DataModel.ApiModels
├── Attempt/
│   ├── AttemptReadFunctions.cs
│   └── AttemptWriteFunctions.cs
└── Admin/
    └── AdminFunctions.cs
```

**Models Location**: All request/response models are in `DataModel/ApiModels/` folder:
- `Quiz.cs` - Quiz, CreateQuizRequest, UpdateQuizRequest, QuizWithQuestions
- `Question.cs` - Question, CreateQuestionRequest, UpdateQuestionRequest
- `Attempt.cs` - Attempt, StartAttemptRequest, SubmitAttemptRequest
- `Response.cs` - Response, SaveResponseRequest

## Naming Convention

### Files
- `{Resource}ReadFunctions.cs` - GET operations
- `{Resource}WriteFunctions.cs` - POST/PUT/DELETE operations
- **Note**: No separate model files in Endpoints - use `DataModel.ApiModels` instead

### Function Names
- Follow pattern: `{Verb}{Resource}` (e.g., `GetQuizzes`, `CreateQuiz`, `UpdateQuiz`)
- Use descriptive names that match HTTP methods

### Routes
- RESTful pattern: `/api/{resource}/{id?}`
- Examples:
  - `GET /api/quizzes` - List all
  - `GET /api/quizzes/{id}` - Get one
  - `POST /api/quizzes` - Create
  - `PUT /api/quizzes/{id}` - Update
  - `DELETE /api/quizzes/{id}` - Delete

## Read vs Write Separation

### Read Functions (Public Access)
- **No API key required**
- GET operations only
- Access to published/public data
- Minimal logging
- Examples: `GetQuizzes`, `GetQuizById`, `GetQuizBySlug`

### Write Functions (Protected)
- **API key required** with appropriate scopes
- POST/PUT/DELETE operations
- Full audit logging
- Rate limiting enforced
- Examples: `CreateQuiz`, `UpdateQuiz`, `DeleteQuiz`

## Benefits of This Structure

✅ **Clear separation of concerns** - Read vs Write operations  
✅ **Easy to secure** - Apply auth only to write functions  
✅ **Better testability** - Test read and write operations independently  
✅ **Scalable** - Add new resources without affecting others  
✅ **Maintainable** - Small, focused files (200-400 lines each)  
✅ **Swagger organization** - Operations grouped by tags  

## Quiz Endpoints (Current)

### Read Operations (Public)

**QuizReadFunctions.cs**
- `GET /api/quizzes` - List published quizzes with filtering
- `GET /api/quizzes/{id}` - Get quiz by ID
- `GET /api/quizzes/slug/{slug}` - Get quiz by slug

### Write Operations (Protected)

**QuizWriteFunctions.cs**
- `POST /api/quizzes` - Create quiz (scope: `quiz:write`)
- `PUT /api/quizzes/{id}` - Update quiz (scope: `quiz:write`)
- `DELETE /api/quizzes/{id}` - Delete quiz (scope: `quiz:delete`)

## Adding New Endpoints

### 1. Create Resource Folder

```powershell
mkdir Endpoints/Question
```

### 2. Ensure Models Exist in DataModel.ApiModels

```csharp
// DataModel/ApiModels/Question.cs (already exists)
namespace Quizz.DataModel.ApiModels
{
    public class Question { ... }
    public class CreateQuestionRequest { ... }
    public class UpdateQuestionRequest { ... }
}
```

### 3. Create Read Functions

```csharp
// Endpoints/Question/QuestionReadFunctions.cs
using Quizz.DataModel.ApiModels; // Import models

namespace Quizz.Functions.Endpoints.Question
{
    public class QuestionReadFunctions
    {
        [Function("GetQuestions")]
        [OpenApiResponseWithBody(typeof(Question), ...)]
        public async Task<HttpResponseData> GetQuestions(...) 
        {
            // Use Question model from DataModel.ApiModels
            var question = new Question { ... };
            return await ResponseHelper.OkAsync(req, question);
        }
    }
}
```

### 4. Create Write Functions

```csharp
// Endpoints/Question/QuestionWriteFunctions.cs
using Quizz.DataModel.ApiModels; // Import models

namespace Quizz.Functions.Endpoints.Question
{
    public class QuestionWriteFunctions
    {
        [Function("CreateQuestion")]
        [OpenApiSecurity("ApiKeyAuth", ...)]
        [OpenApiRequestBody(typeof(CreateQuestionRequest), ...)]
        public async Task<HttpResponseData> CreateQuestion(...) 
        {
            var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                req, _apiKeyService, "question:write", stopwatch);
            
            // Deserialize using DataModel.ApiModels
            var request = await JsonSerializer.DeserializeAsync<CreateQuestionRequest>(req.Body);
            // ... implementation
        }
    }
}
```

## Shared Helpers

All endpoints can use:
- `AuthHelper.ValidateApiKeyAsync()` - Validate API keys
- `AuthHelper.LogSuccessfulUsageAsync()` - Log successful requests
- `ResponseHelper.OkAsync()` - Return 200 OK
- `ResponseHelper.CreatedAsync()` - Return 201 Created
- `ResponseHelper.BadRequestAsync()` - Return 400 Bad Request
- `ResponseHelper.NotFoundAsync()` - Return 404 Not Found
- `ResponseHelper.UnauthorizedAsync()` - Return 401 Unauthorized
- `ResponseHelper.InternalServerErrorAsync()` - Return 500 Error

## OpenAPI/Swagger Tags

Organize Swagger UI by using tags:
- `"Quizzes - Read"` - Public quiz read operations
- `"Quizzes - Write"` - Protected quiz write operations
- `"Questions - Read"` - Public question read operations
- `"Questions - Write"` - Protected question write operations
- `"Attempts"` - Quiz attempt operations
- `"Admin"` - Administrative operations

## Example: Complete CRUD Implementation

```csharp
// Endpoints/Quiz/QuizReadFunctions.cs
using Quizz.DataModel.ApiModels; // Import shared models

namespace Quizz.Functions.Endpoints.Quiz
{
    public class QuizReadFunctions
    {
        [Function("GetQuizzes")]
        [OpenApiOperation(tags: new[] { "Quizzes - Read" })]
        [OpenApiResponseWithBody(typeof(Quiz), ...)]
        public async Task<HttpResponseData> GetQuizzes(...) 
        {
            // Use Quiz from DataModel.ApiModels
            var quizzes = new List<Quiz>();
            // ... populate from database
            return await ResponseHelper.OkAsync(req, quizzes);
        }
    }
}

// Endpoints/Quiz/QuizWriteFunctions.cs
using Quizz.DataModel.ApiModels; // Import shared models

namespace Quizz.Functions.Endpoints.Quiz
{
    public class QuizWriteFunctions
    {
        [Function("CreateQuiz")]
        [OpenApiSecurity("ApiKeyAuth", ...)]
        [OpenApiOperation(tags: new[] { "Quizzes - Write" })]
        [OpenApiRequestBody(typeof(CreateQuizRequest), ...)]
        [OpenApiResponseWithBody(typeof(Quiz), ...)]
        public async Task<HttpResponseData> CreateQuiz(...) 
        {
            // Validate API key
            var (validation, errorResponse) = await AuthHelper.ValidateApiKeyAsync(
                req, _apiKeyService, "quiz:write", stopwatch);
            if (errorResponse != null) return errorResponse;
            
            // Deserialize request using shared models
            var request = await JsonSerializer.DeserializeAsync<CreateQuizRequest>(req.Body);
            
            // Create quiz and return Quiz model
            var createdQuiz = new Quiz { ... };
            
            // Log success
            await AuthHelper.LogSuccessfulUsageAsync(...);
            return await ResponseHelper.CreatedAsync(req, createdQuiz);
        }
    }
}
```

**Key Points**:
- ✅ Import `using Quizz.DataModel.ApiModels;` in all endpoint files
- ✅ Use shared models: `Quiz`, `CreateQuizRequest`, `UpdateQuizRequest`
- ✅ Single source of truth for API contracts
- ✅ Models match database schema exactly

## Validation Patterns

### Input Validation

```csharp
// Required field
if (string.IsNullOrWhiteSpace(body.Title))
{
    return await ResponseHelper.BadRequestAsync(req, 
        "Title is required", 
        new { field = "title" });
}

// Enum validation
if (!validValues.Contains(body.Difficulty))
{
    return await ResponseHelper.BadRequestAsync(req, 
        "Difficulty must be 'easy', 'medium', or 'hard'",
        new { field = "difficulty", validValues });
}

// Range validation
if (body.EstimatedMinutes <= 0)
{
    return await ResponseHelper.BadRequestAsync(req,
        "EstimatedMinutes must be greater than 0",
        new { field = "estimatedMinutes" });
}
```

### Error Handling

```csharp
try
{
    // Operation
}
catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
{
    // Unique constraint violation
    return await ResponseHelper.BadRequestAsync(req, 
        "A quiz with this slug already exists",
        new { field = "slug" });
}
catch (Npgsql.PostgresException ex) when (ex.SqlState == "23503")
{
    // Foreign key violation
    return await ResponseHelper.BadRequestAsync(req,
        "Referenced resource does not exist");
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error creating quiz");
    return await ResponseHelper.InternalServerErrorAsync(req);
}
```

## Performance Considerations

- Use `Stopwatch` to track operation time
- Log operation time for monitoring
- Use appropriate indexes (defined in migration scripts)
- Limit query results (default: 50, max: 100)
- Use pagination for large datasets

## Security Checklist

For each protected endpoint:
- ✅ Add `[OpenApiSecurity("ApiKeyAuth", ...)]` attribute
- ✅ Call `AuthHelper.ValidateApiKeyAsync()` at start
- ✅ Specify required scope (e.g., `quiz:write`)
- ✅ Log successful usage with `AuthHelper.LogSuccessfulUsageAsync()`
- ✅ Return 401 for auth failures
- ✅ Return 429 for rate limit exceeded

## Testing

### Public Endpoints
```bash
curl http://localhost:7071/api/quizzes
```

### Protected Endpoints
```bash
curl -X POST http://localhost:7071/api/quizzes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -d '{"title":"Test","slug":"test","difficulty":"easy","estimatedMinutes":10}'
```

## Next Steps

- [ ] Add Question endpoints (Read + Write)
- [ ] Add Attempt endpoints (Start, Submit, GetResults)
- [ ] Add Response endpoints (Save answers)
- [ ] Add Admin endpoints (Manage API keys)
- [ ] Add health check endpoint
- [ ] Add metrics endpoint
