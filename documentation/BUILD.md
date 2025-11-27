# Building the Kids Quiz Solution

## Prerequisites

1. **.NET 8 SDK** - Download from https://dotnet.microsoft.com/download/dotnet/8.0
   ```powershell
   # Or install via winget
   winget install Microsoft.DotNet.SDK.8
   ```

2. **Azure Functions Core Tools** (for local testing)
   ```powershell
   winget install Microsoft.Azure.FunctionsCoreTools
   ```

3. **PostgreSQL** (for database)
   ```powershell
   winget install PostgreSQL.PostgreSQL
   ```

## Project Structure

```
Quizz/
├── DataModel/          # Data models and DTOs
│   └── DataModel.csproj
├── DataAccess/         # Database access layer
│   └── DataAccess.csproj
├── Auth/               # Authentication services
│   └── Auth.csproj
├── Functions/          # Azure Functions API
│   └── Functions.csproj
├── DatabaseScripts/    # SQL migrations
└── Build.ps1          # Build automation script
```

## Quick Start

### 1. Build All Projects

```powershell
cd c:\CodeBase\Quizz

# Full build with restore
.\Build.ps1 -Restore

# Clean and rebuild
.\Build.ps1 -Clean -Restore
```

### 2. Or Build Manually

```powershell
# Restore packages
dotnet restore DataModel/DataModel.csproj
dotnet restore DataAccess/DataAccess.csproj
dotnet restore Auth/Auth.csproj
dotnet restore Functions/Functions.csproj

# Build in order (dependencies first)
dotnet build DataModel/DataModel.csproj
dotnet build DataAccess/DataAccess.csproj
dotnet build Auth/Auth.csproj
dotnet build Functions/Functions.csproj
```

### 3. Setup Database

```powershell
cd DatabaseScripts
.\Deploy-Database.ps1 -PromptForPassword
```

### 4. Run Functions Locally

```powershell
cd Functions
func start
```

## Project Dependencies

```
Functions
  ├── Auth
  │   └── DataAccess
  │       └── DataModel
  ├── DataAccess
  │   └── DataModel
  └── DataModel
```

## Build Errors?

If you see errors like "The type or namespace name 'DataAccess' does not exist":

1. **Verify .NET SDK is installed**:
   ```powershell
   dotnet --version
   # Should show 8.0.x
   ```

2. **Restore packages**:
   ```powershell
   .\Build.ps1 -Restore
   ```

3. **Clean and rebuild**:
   ```powershell
   .\Build.ps1 -Clean -Restore
   ```

4. **Reload VS Code** after building to refresh IntelliSense

## Testing

Once built and running:

1. **Open Swagger UI**:
   http://localhost:7071/internal-docs/swagger/ui?code=your-secret-swagger-key-change-this

2. **Test public endpoint**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes"
   ```

3. **Test with API key** (see TESTING.md for creating API keys):
   ```powershell
   $headers = @{ "X-API-Key" = "test_key_12345" }
   Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes" -Method Post -Headers $headers -Body $jsonBody
   ```

## Next Steps

- See `DatabaseScripts/DEPLOY-README.md` for database setup
- See `TESTING.md` for complete testing guide
- See `Functions/Endpoints/README.md` for API documentation
