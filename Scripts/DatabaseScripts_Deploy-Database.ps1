# ============================================================================
# Deploy-Database.ps1
# PowerShell script to deploy all database migrations to PostgreSQL
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Server = "mcl-lms-dev.postgres.database.azure.com",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 5432,
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "quiz",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "mcladmin",
    
    [Parameter(Mandatory=$false)]
    [string]$Password="Seattle@2025",
    
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
$ProgressPreference = "SilentlyContinue"

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

function Test-PostgreSQLConnection {
    param(
        [string]$ConnectionString
    )
    
    try {
        Write-Info "Testing database connection..."
        
        # Use psql to test connection
        $testQuery = "SELECT version();"
        $result = & psql $ConnectionString -c $testQuery 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection successful"
            return $true
        } else {
            Write-Fail "Database connection failed: $result"
            return $false
        }
    } catch {
        Write-Fail "Failed to connect to database: $($_.Exception.Message)"
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
        
        # Execute SQL script using psql
        $result = & psql $ConnectionString -f $ScriptPath 2>&1
        
        $stopwatch.Stop()
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Completed: $ScriptName (${stopwatch.ElapsedMilliseconds}ms)"
            return $true
        } else {
            Write-Fail "Failed: $ScriptName"
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Fail "Error executing $ScriptName : $($_.Exception.Message)"
        return $false
    }
}

function Test-PSQLInstalled {
    try {
        $psqlVersion = & psql --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL client (psql) is installed: $psqlVersion"
            return $true
        }
    } catch {
        Write-Fail "PostgreSQL client (psql) is not installed or not in PATH"
        Write-Info "Install PostgreSQL client: https://www.postgresql.org/download/"
        return $false
    }
}

function Get-DatabaseExists {
    param(
        [string]$Server,
        [int]$Port,
        [string]$Database,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $env:PGPASSWORD = $Password
        $connectionString = "postgresql://${Username}@${Server}:${Port}/postgres"
        
        $query = "SELECT 1 FROM pg_database WHERE datname = '$Database';"
        $result = & psql $connectionString -t -c $query 2>&1
        
        Remove-Item Env:\PGPASSWORD
        
        if ($result -match "1") {
            return $true
        }
        return $false
    } catch {
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
        $exists = Get-DatabaseExists -Server $Server -Port $Port -Database $Database -Username $Username -Password $Password
        
        if (-not $exists) {
            Write-Info "Database '$Database' does not exist. Creating..."
            
            $env:PGPASSWORD = $Password
            $connectionString = "postgresql://${Username}@${Server}:${Port}/postgres"
            
            $createDbQuery = "CREATE DATABASE $Database;"
            $result = & psql $connectionString -c $createDbQuery 2>&1
            
            Remove-Item Env:\PGPASSWORD
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Database '$Database' created successfully"
                return $true
            } else {
                Write-Fail "Failed to create database: $result"
                return $false
            }
        } else {
            Write-Info "Database '$Database' already exists"
            return $true
        }
    } catch {
        Write-Fail "Error checking/creating database: $($_.Exception.Message)"
        return $false
    }
}

# ============================================================================
# Main Script
# ============================================================================

Write-Header "Kids Quiz Database Deployment"

# Check if psql is installed
#if (-not (Test-PSQLInstalled)) {
#    exit 1
#}

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

# Set environment variable for password (psql uses PGPASSWORD)
$env:PGPASSWORD = $Password

# Build connection string
$connectionString = "postgresql://${Username}@${Server}:${Port}/$Database"

# Create database if it doesn't exist
if (-not $WhatIf) {
    if (-not (New-DatabaseIfNotExists -Server $Server -Port $Port -Database $Database -Username $Username -Password $Password)) {
        Write-Fail "Failed to ensure database exists"
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
}

$env:PGPASSWORD = $Password
#Test connection
if (-not $WhatIf) {
    Write-Host $connectionString
    Write-Host $env:PGPASSWORD
    if (-not (Test-PostgreSQLConnection -ConnectionString $connectionString)) {
        Write-Fail "Cannot proceed without a valid database connection"
        Remove-Item Env:\PGPASSWORD
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
        } else {
            if (Invoke-SqlScript -ConnectionString $connectionString -ScriptPath $scriptPath -ScriptName $scriptName) {
                $successCount++
            } else {
                $failureCount++
                Write-Warn "Failed to execute $scriptName - continuing with remaining scripts..."
            }
        }
    } else {
        Write-Warn "Script not found: $scriptName (skipping)"
        $skippedCount++
    }
}

# Clean up
Remove-Item Env:\PGPASSWORD

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
    
    # Query schema version
    Write-Info "Current schema versions:"
    & psql "postgresql://${Username}:${Password}@${Server}:${Port}/$Database" -c "SELECT version_number, description, applied_at FROM quiz.schema_versions ORDER BY applied_at;" 2>&1 | Out-Null
    
    exit 0
} elseif ($WhatIf) {
    Write-Info "WhatIf mode completed - no changes were made"
    exit 0
} else {
    Write-Fail "Database deployment completed with errors"
    exit 1
}
