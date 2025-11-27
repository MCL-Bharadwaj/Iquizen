# Build script for Quiz solution
param(
    [switch]$Clean,
    [switch]$Restore
)

Write-Host "Building Kids Quiz Solution..." -ForegroundColor Cyan

$RootPath = Split-Path -Parent $PSScriptRoot
$Projects = @(
    "$RootPath\DataModel\DataModel.csproj",
    "$RootPath\DataAccess\DataAccess.csproj",
    "$RootPath\Auth\Auth.csproj",
    "$RootPath\Functions\Functions.csproj"
)

if ($Clean) {
    Write-Host "Cleaning projects..." -ForegroundColor Yellow
    foreach ($project in $Projects) {
        dotnet clean $project
    }
}

if ($Restore) {
    Write-Host "Restoring packages..." -ForegroundColor Yellow
    foreach ($project in $Projects) {
        dotnet restore $project
    }
}

Write-Host "Building projects..." -ForegroundColor Yellow
foreach ($project in $Projects) {
    $projectName = Split-Path -Leaf $project
    Write-Host "  Building $projectName..." -ForegroundColor Gray
    dotnet build $project --no-restore
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed for $projectName" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Build completed successfully!" -ForegroundColor Green
