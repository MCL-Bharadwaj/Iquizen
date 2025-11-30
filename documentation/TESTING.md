# Testing the Quiz API - Setup Guide

## Prerequisites

Before testing the API, you need to install the following tools:

### 1. .NET 8 SDK

The Azure Functions project uses .NET 8 isolated worker runtime.

**Install via winget**:
```powershell
winget install Microsoft.DotNet.SDK.8
```

**Or download from**: https://dotnet.microsoft.com/download/dotnet/8.0

**Verify installation**:
```powershell
dotnet --version
# Should show: 8.0.x
```

### 2. Azure Functions Core Tools v4

Required to run Azure Functions locally.

**Install via winget**:
```powershell
winget install Microsoft.Azure.FunctionsCore
```

**Or download from**: https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local

**Verify installation**:
```powershell
func --version
# Should show: 4.x.x
```

### 3. PostgreSQL Database

Ensure PostgreSQL is running locally.

**Check if running**:
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*
```

**Connection details** (update in `local.settings.json`):
- Host: `localhost`
- Port: `5432`
- Database: `quizdb`
- Username: `postgres`
- Password: Update in `local.settings.json`

---

## Setup Steps

### 1. Install Prerequisites

```powershell
# Install .NET 8 SDK
winget install Microsoft.DotNet.SDK.8

# Install Azure Functions Core Tools
winget install Microsoft.Azure.FunctionsCore

# Restart PowerShell to refresh PATH
```

### 2. Setup Database

```powershell
# Navigate to database scripts
cd c:\CodeBase\Quizz\DatabaseScripts

# Run migrations (from PostgreSQL psql or your preferred tool)
psql -U postgres -d quizdb -f 000_migration_setup.sql
psql -U postgres -d quizdb -f 001_quizzes.sql
psql -U postgres -d quizdb -f 002_questions.sql
psql -U postgres -d quizdb -f 003_quiz_questions.sql
psql -U postgres -d quizdb -f 004_attempts.sql
psql -U postgres -d quizdb -f 005_responses.sql
psql -U postgres -d quizdb -f 006_content.sql
psql -U postgres -d quizdb -f 007_audit_log.sql
psql -U postgres -d quizdb -f 008_api_keys.sql
```

### 3. Update Configuration

Edit `c:\CodeBase\Quizz\Functions\local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "Db__ConnectionString": "Host=localhost;Port=5432;Database=quizdb;Username=postgres;Password=YOUR_PASSWORD",
    "SwaggerPath": "/internal-docs",
    "SwaggerAuthKey": "your-secret-swagger-key-change-this"
  }
}
```

**Update**: Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 4. Build the Project

```powershell
cd c:\CodeBase\Quizz\Functions
dotnet restore
dotnet build
```

### 5. Start the Functions App

```powershell
cd c:\CodeBase\Quizz\Functions
func start
```

**Expected output**:
```
Azure Functions Core Tools
Core Tools Version:       4.x.x
Function Runtime Version: 4.x.x

Functions:
  CreateQuiz: [POST] http://localhost:7071/api/quizzes
  DeleteQuiz: [DELETE] http://localhost:7071/api/quizzes/{quizId}
  GetQuizById: [GET] http://localhost:7071/api/quizzes/{quizId}
  GetQuizzes: [GET] http://localhost:7071/api/quizzes
  UpdateQuiz: [PUT] http://localhost:7071/api/quizzes/{quizId}
  RenderSwaggerUI: [GET] http://localhost:7071/internal-docs/swagger/ui

For detailed output, run func with --verbose flag.
```

---

## Testing the API

### 1. Test Swagger UI

Open browser: http://localhost:7071/internal-docs/swagger/ui?code=your-secret-swagger-key-change-this

### 2. Test Public Endpoints (No Auth)

```powershell
# List all quizzes
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes" -Method Get

# Get specific quiz (replace with actual UUID after creating one)
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes/12345678-1234-1234-1234-123456789abc" -Method Get
```

### 3. Create API Key (Manual DB Insert)

First, you need to create an API key in the database:

```sql
-- Connect to database
psql -U postgres -d quizdb

-- Create API key (bcrypt hash of "test_key_12345")
INSERT INTO api_keys (
    key_id, 
    key_hash, 
    key_name, 
    scopes, 
    is_active,
    created_at
)
VALUES (
    gen_random_uuid(),
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of "test_key_12345"
    'Test Key',
    ARRAY['quiz:read', 'quiz:write', 'quiz:delete'],
    true,
    CURRENT_TIMESTAMP
);

-- Verify
SELECT key_id, key_name, scopes, is_active FROM api_keys;
```

### 4. Test Protected Endpoints (With API Key)

```powershell
# Create quiz
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "test_key_12345"
}

$body = @{
    title = "Math Quiz - Addition"
    description = "Basic addition problems for kids"
    ageMin = 8
    ageMax = 10
    subject = "Math"
    difficulty = "easy"
    estimatedMinutes = 15
    tags = @("addition", "basic-math")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes" -Method Post -Headers $headers -Body $body

# Update quiz (use the UUID from create response)
$updateBody = @{
    title = "Math Quiz - Addition (Updated)"
    description = "Updated description"
    ageMin = 8
    ageMax = 10
    subject = "Math"
    difficulty = "medium"
    estimatedMinutes = 20
    tags = @("addition", "basic-math", "updated")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes/YOUR_QUIZ_ID" -Method Put -Headers $headers -Body $updateBody

# Delete quiz
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes/YOUR_QUIZ_ID" -Method Delete -Headers $headers
```

### 5. Test with cURL (Alternative)

```bash
# List quizzes
curl http://localhost:7071/api/quizzes

# Create quiz
curl -X POST http://localhost:7071/api/quizzes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
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
```

---

## Troubleshooting

### Functions won't start

**Error**: `The term 'func' is not recognized`
- **Fix**: Install Azure Functions Core Tools (see Prerequisites)

**Error**: `The term 'dotnet' is not recognized`
- **Fix**: Install .NET 8 SDK (see Prerequisites)

### Database connection fails

**Error**: `Connection refused` or `Could not connect to server`
- **Fix**: Ensure PostgreSQL is running: `Get-Service postgresql*`
- **Fix**: Check connection string in `local.settings.json`

### API Key validation fails

**Error**: `401 Unauthorized`
- **Fix**: Ensure API key exists in database (see Create API Key section)
- **Fix**: Check `X-API-Key` header is set correctly

### Swagger UI requires authentication

**Error**: `403 Forbidden` when accessing Swagger
- **Fix**: Add query parameter: `?code=your-secret-swagger-key-change-this`
- **Fix**: Or add header: `SwaggerAuthKey: your-secret-swagger-key-change-this`

---

## Next Steps After Testing

1. ✅ Verify all Quiz endpoints work
2. 📝 Create Question endpoints (Read/Write)
3. 📝 Create Attempt endpoints (Start/Submit)
4. 📝 Create Admin endpoints (API key management)
5. 📝 Add integration tests
6. 🚀 Deploy to Azure

---

## Useful Commands

```powershell
# Build
dotnet build

# Run with verbose logging
func start --verbose

# Clean build
dotnet clean
dotnet build

# Check for errors
dotnet build --no-incremental

# Run specific function
func start --functions GetQuizzes

# View logs
# Logs appear in terminal output
```

---

## Environment Variables

Current configuration in `local.settings.json`:

| Variable | Purpose | Default Value |
|----------|---------|---------------|
| `Db__ConnectionString` | Database connection | `Host=localhost;Database=quizdb;...` |
| `SwaggerAuthKey` | Swagger UI access | `your-secret-swagger-key-change-this` |
| `SwaggerPath` | Swagger base path | `/internal-docs` |
| `FUNCTIONS_WORKER_RUNTIME` | Runtime type | `dotnet-isolated` |
| `AzureWebJobsStorage` | Local storage | `UseDevelopmentStorage=true` |
