# Quick Azure Deployment Script
# Run this after creating resources in Azure Portal

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionAppName,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName
)

Write-Host "🚀 Starting Azure Deployment..." -ForegroundColor Green

# Check if logged in to Azure
Write-Host "`n📋 Checking Azure CLI login..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "❌ Not logged in to Azure. Running 'az login'..." -ForegroundColor Red
    az login
}

Write-Host "✅ Logged in to Azure" -ForegroundColor Green
az account show --query "{Subscription:name, ID:id}" --output table

# Deploy Azure Functions
Write-Host "`n📦 Building and deploying Azure Functions..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\Functions"

Write-Host "Building .NET project..."
dotnet clean
dotnet restore
dotnet build --configuration Release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Publishing..."
dotnet publish --configuration Release --output ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Publish failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to Azure Functions: $FunctionAppName..."
func azure functionapp publish $FunctionAppName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Function deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Azure Functions deployed successfully!" -ForegroundColor Green

# Get Function App URL
$functionUrl = az functionapp show --name $FunctionAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
Write-Host "`n🔗 Function App URL: https://$functionUrl" -ForegroundColor Cyan

# Deploy Static Web App (if name provided)
if ($StaticWebAppName) {
    Write-Host "`n📦 Building and deploying Static Web App..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\quiz-app"
    
    # Check if .env.production exists, create if not
    if (-not (Test-Path ".env.production")) {
        Write-Host "Creating .env.production..."
        "VITE_API_URL=https://$functionUrl/api" | Out-File -FilePath ".env.production" -Encoding UTF8
    } else {
        Write-Host ".env.production already exists"
    }
    
    Write-Host "Installing dependencies..."
    npm install
    
    Write-Host "Building React app..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Getting deployment token..."
    $deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" --output tsv
    
    if (-not $deploymentToken) {
        Write-Host "❌ Could not get deployment token!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Deploying to Static Web App: $StaticWebAppName..."
    npx swa deploy ./dist --deployment-token $deploymentToken --env production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Static Web App deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    # Get Static Web App URL
    $swaUrl = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup --query "defaultHostname" --output tsv
    
    Write-Host "✅ Static Web App deployed successfully!" -ForegroundColor Green
    Write-Host "`n🔗 Static Web App URL: https://$swaUrl" -ForegroundColor Cyan
    
    # Update CORS on Function App
    Write-Host "`n🔧 Updating CORS settings..." -ForegroundColor Yellow
    az functionapp cors add --name $FunctionAppName --resource-group $ResourceGroup --allowed-origins "https://$swaUrl"
    Write-Host "✅ CORS updated" -ForegroundColor Green
}

Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "  Function App: https://$functionUrl" -ForegroundColor White
if ($StaticWebAppName) {
    Write-Host "  Static Web App: https://$swaUrl" -ForegroundColor White
}
Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test your API: https://$functionUrl/api/health" -ForegroundColor White
if ($StaticWebAppName) {
    Write-Host "  2. Visit your app: https://$swaUrl" -ForegroundColor White
}
Write-Host "  3. Check Application Insights for logs" -ForegroundColor White
Write-Host "  4. Monitor performance and errors" -ForegroundColor White

Set-Location $PSScriptRoot
