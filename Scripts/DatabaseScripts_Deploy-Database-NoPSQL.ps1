# ============================================================================
# Deploy-Database-NoPSQL.ps1
# PowerShell script to deploy database migrations using .NET Npgsql (no psql required)
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Server = "mcl-lms-dev.postgres.database.azure.com",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 5432,
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "quiz",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "azureUser",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "Sea@2025",
    
    [Parameter(Mandatory=$false)]
    [switch]$PromptForPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$ScriptsPath = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

# ============================================================================
# Configuration
# ============================================================================

$ErrorActionPreference = "Stop"

# Script execution order
$MigrationScripts = @(
    "000_migration_setup.sql",
    "001_quizzes.sql",
    "002_questions.sql",
    "003_quiz_questions.sql",
    "003_seed_data.sql",
    "004_attempts.sql",
    "005_responses.sql",
    "006_content.sql",
    "007_audit_log.sql",
    "008_api_keys.sql"
)

# Load Npgsql assembly from NuGet package (assumes DataAccess project is built)
$npgsqlDllPath = Join-Path $PSScriptRoot "..\DataAccess\bin\Debug\net8.0\Npgsql.dll"
if (-not (Test-Path $npgsqlDllPath)) {
    Write-Host "[ERROR] Npgsql.dll not found at: $npgsqlDllPath" -ForegroundColor Red
    Write-Host "[INFO] Please build the DataAccess project first: dotnet build" -ForegroundColor Cyan
    exit 1
}

Add-Type -Path $npgsqlDllPath

# ============================================================================
# Functions
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Get-ConnectionString {
    param(
        [string]$Server,
        [int]$Port,
        [string]$Database,
        [string]$Username,
        [string]$Password
    )
    return "Host=$Server;Port=$Port;Database=$Database;Username=$Username;Password=$Password;SSL Mode=Require;Trust Server Certificate=true;"
}

function Test-DatabaseConnection {
    param([string]$ConnectionString)
    
    try {
        Write-Info "Testing database connection..."
        $conn = New-Object Npgsql.NpgsqlConnection($ConnectionString)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT version();"
        $version = $cmd.ExecuteScalar()
        
        $conn.Close()
        $conn.Dispose()
        
        Write-Success "Database connection successful"
        Write-Host "  PostgreSQL version: $version" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Fail "Database connection failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DatabaseExists {
    param(
        [string]$Server,
        [int]$Port,
        [string]$Database,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $connStr = Get-ConnectionString -Server $Server -Port $Port -Database "postgres" -Username $Username -Password $Password
        $conn = New-Object Npgsql.NpgsqlConnection($connStr)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT 1 FROM pg_database WHERE datname = @dbname;"
        $param = $cmd.Parameters.AddWithValue("dbname", $Database)
        $result = $cmd.ExecuteScalar()
        
        $conn.Close()
        $conn.Dispose()
        
        return ($null -ne $result)
    }
    catch {
        Write-Warn "Could not check if database exists: $($_.Exception.Message)"
        return $false
    }
}

function New-DatabaseIfNotExists {
    param(
        [string]$Server,
        [int]$Port,
        [string]$Database,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $exists = Test-DatabaseExists -Server $Server -Port $Port -Database $Database -Username $Username -Password $Password
        
        if (-not $exists) {
            Write-Info "Database '$Database' does not exist. Creating..."
            
            $connStr = Get-ConnectionString -Server $Server -Port $Port -Database "postgres" -Username $Username -Password $Password
            $conn = New-Object Npgsql.NpgsqlConnection($connStr)
            $conn.Open()
            
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "CREATE DATABASE ""$Database"";"
            $cmd.ExecuteNonQuery() | Out-Null
            
            $conn.Close()
            $conn.Dispose()
            
            Write-Success "Database '$Database' created successfully"
            return $true
        }
        else {
            Write-Info "Database '$Database' already exists"
            return $true
        }
    }
    catch {
        Write-Fail "Error creating database: $($_.Exception.Message)"
        return $false
    }
}

function Invoke-SqlScript {
    param(
        [string]$ConnectionString,
        [string]$ScriptPath,
        [string]$ScriptName
    )
    
    try {
        Write-Info "Executing: $ScriptName"
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        # Read the SQL script
        $sqlContent = Get-Content -Path $ScriptPath -Raw -Encoding UTF8
        
        # Execute the script
        $conn = New-Object Npgsql.NpgsqlConnection($ConnectionString)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sqlContent
        $cmd.CommandTimeout = 300 # 5 minutes timeout
        
        try {
            $cmd.ExecuteNonQuery() | Out-Null
            $stopwatch.Stop()
            
            Write-Success "Completed: $ScriptName ($($stopwatch.ElapsedMilliseconds)ms)"
            return $true
        }
        catch {
            $stopwatch.Stop()
            Write-Fail "Failed: $ScriptName"
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
        finally {
            $conn.Close()
            $conn.Dispose()
        }
    }
    catch {
        Write-Fail "Error reading/executing $ScriptName : $($_.Exception.Message)"
        return $false
    }
}

# ============================================================================
# Main Script
# ============================================================================

Write-Header "Kids Quiz Database Deployment (Using .NET)"

# Prompt for password if needed
if ($PromptForPassword -or [string]::IsNullOrWhiteSpace($Password)) {
    $securePassword = Read-Host "Enter PostgreSQL password for user '$Username'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Validate scripts path
$ScriptsPath = Resolve-Path $ScriptsPath
if (-not (Test-Path $ScriptsPath)) {
    Write-Fail "Scripts path not found: $ScriptsPath"
    exit 1
}

Write-Info "Configuration:"
Write-Host "  Server:   $Server" -ForegroundColor Gray
Write-Host "  Port:     $Port" -ForegroundColor Gray
Write-Host "  Database: $Database" -ForegroundColor Gray
Write-Host "  Username: $Username" -ForegroundColor Gray
Write-Host "  Scripts:  $ScriptsPath" -ForegroundColor Gray

if ($WhatIf) {
    Write-Warn "Running in WhatIf mode - no changes will be made"
}

# Build connection string
$connectionString = Get-ConnectionString -Server $Server -Port $Port -Database $Database -Username $Username -Password $Password

# Create database if it doesn't exist
if (-not $WhatIf) {
    if (-not (New-DatabaseIfNotExists -Server $Server -Port $Port -Database $Database -Username $Username -Password $Password)) {
        Write-Fail "Failed to ensure database exists"
        exit 1
    }
}

# Test connection
if (-not $WhatIf) {
    if (-not (Test-DatabaseConnection -ConnectionString $connectionString)) {
        Write-Fail "Cannot proceed without a valid database connection"
        exit 1
    }
}

# Execute migration scripts in order
Write-Header "Executing Migration Scripts"

$successCount = 0
$failureCount = 0
$skippedCount = 0

foreach ($scriptName in $MigrationScripts) {
    $scriptPath = Join-Path $ScriptsPath $scriptName
    
    if (Test-Path $scriptPath) {
        if ($WhatIf) {
            Write-Info "Would execute: $scriptName"
            $skippedCount++
        }
        else {
            if (Invoke-SqlScript -ConnectionString $connectionString -ScriptPath $scriptPath -ScriptName $scriptName) {
                $successCount++
            }
            else {
                $failureCount++
                Write-Warn "Failed to execute $scriptName - continuing with remaining scripts..."
            }
        }
    }
    else {
        Write-Warn "Script not found: $scriptName (skipping)"
        $skippedCount++
    }
}

# Summary
Write-Header "Deployment Summary"

Write-Host "Total Scripts:   $($MigrationScripts.Count)" -ForegroundColor Gray
Write-Success "Successful:      $successCount"

if ($failureCount -gt 0) {
    Write-Fail "Failed:          $failureCount"
}

if ($skippedCount -gt 0) {
    Write-Warn "Skipped:         $skippedCount"
}

Write-Host ""

if ($failureCount -eq 0 -and -not $WhatIf) {
    Write-Success "Database deployment completed successfully!"
    
    # Query schema versions
    Write-Info "Current schema versions:"
    try {
        $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT version_number, description, applied_at FROM quiz.schema_versions ORDER BY applied_at;"
        $reader = $cmd.ExecuteReader()
        
        Write-Host ""
        while ($reader.Read()) {
            Write-Host ("  {0,-20} {1,-50} {2}" -f $reader["version_number"], $reader["description"], $reader["applied_at"]) -ForegroundColor Gray
        }
        
        $reader.Close()
        $conn.Close()
        $conn.Dispose()
    }
    catch {
        Write-Warn "Could not query schema versions: $($_.Exception.Message)"
    }
    
    Write-Host ""
    exit 0
}
elseif ($WhatIf) {
    Write-Info "WhatIf mode completed - no changes were made"
    exit 0
}
else {
    Write-Fail "Database deployment completed with errors"
    exit 1
}
