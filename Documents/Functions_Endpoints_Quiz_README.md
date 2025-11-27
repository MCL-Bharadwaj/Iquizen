# Quiz Endpoints

This folder contains HTTP endpoints for Quiz resource operations.

## Structure

```
Quiz/
├── QuizReadFunctions.cs    # Public GET operations
└── QuizWriteFunctions.cs   # Protected POST/PUT/DELETE operations
```

**Note**: This folder does NOT contain model files. All models are imported from `DataModel.ApiModels`.

## Models Used

All endpoints use models from `Quizz.DataModel.ApiModels`:

```csharp
using Quizz.DataModel.ApiModels;
```

**Request Models**:
- `CreateQuizRequest` - Create new quiz
- `UpdateQuizRequest` - Update existing quiz

**Response Models**:
- `Quiz` - Single quiz response
- `QuizWithQuestions` - Quiz with associated questions

## Schema

The Quiz model matches the database schema exactly:

| Property | Type | Database Column | Description |
|----------|------|-----------------|-------------|
| `QuizId` | `Guid` | `quiz_id` | Primary key |
| `Title` | `string` | `title` | Quiz title (required) |
| `Description` | `string?` | `description` | Quiz description |
| `AgeMin` | `int?` | `age_min` | Minimum age recommendation |
| `AgeMax` | `int?` | `age_max` | Maximum age recommendation |
| `Subject` | `string?` | `subject` | Subject area (e.g., "Math", "Science") |
| `Difficulty` | `string?` | `difficulty` | Difficulty level (e.g., "easy", "medium", "hard") |
| `EstimatedMinutes` | `int?` | `estimated_minutes` | Estimated completion time |
| `Tags` | `string[]?` | `tags` | Array of tags for categorization |
| `CreatedAt` | `DateTime` | `created_at` | Creation timestamp |
| `UpdatedAt` | `DateTime` | `updated_at` | Last update timestamp |

## Endpoints

### Public Endpoints (No Auth Required)

#### GET /api/quizzes
List all quizzes with optional filtering.

**Query Parameters**:
- `difficulty` (optional) - Filter by difficulty
- `tags` (optional) - Comma-separated list of tags
- `limit` (optional, default: 50, max: 100) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Response**: `200 OK`
```json
{
  "data": [
    {
      "quizId": "uuid",
      "title": "string",
      "description": "string",
      "ageMin": 8,
      "ageMax": 12,
      "subject": "Math",
      "difficulty": "easy",
      "estimatedMinutes": 15,
      "tags": ["addition", "subtraction"],
      "createdAt": "2025-11-08T10:00:00Z",
      "updatedAt": "2025-11-08T10:00:00Z"
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/quizzes/{quizId}
Get a single quiz by ID.

**Path Parameters**:
- `quizId` - UUID of the quiz

**Response**: `200 OK`
```json
{
  "quizId": "uuid",
  "title": "string",
  "description": "string",
  "ageMin": 8,
  "ageMax": 12,
  "subject": "Math",
  "difficulty": "easy",
  "estimatedMinutes": 15,
  "tags": ["addition"],
  "createdAt": "2025-11-08T10:00:00Z",
  "updatedAt": "2025-11-08T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid quiz ID format
- `404 Not Found` - Quiz not found

### Protected Endpoints (API Key Required)

All write operations require API key with appropriate scope in `X-API-Key` header.

#### POST /api/quizzes
Create a new quiz.

**Required Scope**: `quiz:write`

**Request Body**:
```json
{
  "title": "Math Quiz - Addition",
  "description": "Basic addition problems for kids",
  "ageMin": 8,
  "ageMax": 10,
  "subject": "Math",
  "difficulty": "easy",
  "estimatedMinutes": 15,
  "tags": ["addition", "basic-math"],
  "questionIds": ["uuid1", "uuid2"]
}
```

**Response**: `201 Created`
```json
{
  "quizId": "uuid",
  "title": "Math Quiz - Addition",
  "description": "Basic addition problems for kids",
  "ageMin": 8,
  "ageMax": 10,
  "subject": "Math",
  "difficulty": "easy",
  "estimatedMinutes": 15,
  "tags": ["addition", "basic-math"],
  "createdAt": "2025-11-08T10:00:00Z",
  "updatedAt": "2025-11-08T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid API key
- `429 Too Many Requests` - Rate limit exceeded

#### PUT /api/quizzes/{quizId}
Update an existing quiz.

**Required Scope**: `quiz:write`

**Path Parameters**:
- `quizId` - UUID of the quiz to update

**Request Body**: Same as POST (all fields optional except `title`)

**Response**: `200 OK` (returns updated quiz)

**Error Responses**:
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - Quiz not found

#### DELETE /api/quizzes/{quizId}
Soft delete a quiz.

**Required Scope**: `quiz:delete`

**Path Parameters**:
- `quizId` - UUID of the quiz to delete

**Response**: `204 No Content`

**Error Responses**:
- `400 Bad Request` - Invalid quiz ID format
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - Quiz not found

## Usage Examples

### Public Access (No Auth)

```bash
# List quizzes
curl http://localhost:7071/api/quizzes

# Filter by difficulty and tags
curl "http://localhost:7071/api/quizzes?difficulty=easy&tags=math,addition"

# Get specific quiz
curl http://localhost:7071/api/quizzes/12345678-1234-1234-1234-123456789abc
```

### Protected Access (API Key Required)

```bash
# Create quiz
curl -X POST http://localhost:7071/api/quizzes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "Math Quiz",
    "description": "Basic math problems",
    "ageMin": 8,
    "ageMax": 10,
    "subject": "Math",
    "difficulty": "easy",
    "estimatedMinutes": 15,
    "tags": ["addition", "subtraction"]
  }'

# Update quiz
curl -X PUT http://localhost:7071/api/quizzes/12345678-1234-1234-1234-123456789abc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "Updated Math Quiz",
    "difficulty": "medium"
  }'

# Delete quiz
curl -X DELETE http://localhost:7071/api/quizzes/12345678-1234-1234-1234-123456789abc \
  -H "X-API-Key: your_api_key_here"
```

## Implementation Notes

### Database Access
- All functions use raw SQL queries to ensure exact schema matching
- Soft deletes are used (sets `deleted_at` timestamp)
- Functions filter out deleted records (`WHERE deleted_at IS NULL`)

### Error Handling
- PostgreSQL constraint violations are caught and converted to appropriate HTTP errors
- All errors are logged with context
- Sensitive error details are not exposed to clients

### Performance
- Operations are timed using `Stopwatch`
- Execution time is logged for monitoring
- Database queries use indexes defined in migration scripts

### Security
- Write operations validate API key and required scopes
- Successful operations are logged to `api_key_audit` table
- Rate limiting is enforced through API key validation

## Swagger/OpenAPI

All endpoints are documented with OpenAPI attributes and appear in Swagger UI at `/internal-docs/swagger/ui`.

**Tags**:
- `Quizzes - Read` - Public read operations
- `Quizzes - Write` - Protected write operations

**Security Scheme**: `ApiKeyAuth` (header: `X-API-Key`)
