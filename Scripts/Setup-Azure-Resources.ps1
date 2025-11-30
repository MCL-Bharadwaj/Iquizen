# Azure Resources Setup Script
# Creates all required Azure resources for Quiz App

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$AppName
)

$FunctionAppName = "func-$AppName"
$StaticWebAppName = "swa-$AppName"
$StorageAccountName = "st$($AppName.Replace('-',''))"
$AppInsightsName = "ai-$AppName"
$KeyVaultName = "kv-$AppName"

Write-Host "🚀 Creating Azure Resources for Quiz App..." -ForegroundColor Green
Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  App Name: $AppName" -ForegroundColor White
Write-Host "  Function App: $FunctionAppName" -ForegroundColor White
Write-Host "  Static Web App: $StaticWebAppName" -ForegroundColor White
Write-Host "  Storage: $StorageAccountName" -ForegroundColor White

# Login check
$account = az account show 2>$null
if (-not $account) {
    Write-Host "`n❌ Not logged in. Running 'az login'..." -ForegroundColor Red
    az login
}

Write-Host "`n✅ Logged in to Azure" -ForegroundColor Green
az account show --query "{Subscription:name, ID:id}" --output table

# Create Resource Group
Write-Host "`n📦 Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource Group created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Resource Group might already exist" -ForegroundColor Yellow
}

# Create Storage Account
Write-Host "`n📦 Creating Storage Account..." -ForegroundColor Yellow
az storage account create `
    --name $StorageAccountName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage Account created" -ForegroundColor Green
} else {
    Write-Host "❌ Storage Account creation failed" -ForegroundColor Red
}

# Create Application Insights
Write-Host "`n📊 Creating Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create `
    --app $AppInsightsName `
    --location $Location `
    --resource-group $ResourceGroup `
    --application-type web

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application Insights created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Application Insights might already exist" -ForegroundColor Yellow
}

# Get instrumentation key
$instrumentationKey = az monitor app-insights component show `
    --app $AppInsightsName `
    --resource-group $ResourceGroup `
    --query "instrumentationKey" `
    --output tsv

# Create Function App with Flex Consumption plan
Write-Host "`n📦 Creating Function App..." -ForegroundColor Yellow
az functionapp create `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --consumption-plan-location $Location `
    --runtime dotnet-isolated `
    --runtime-version 8 `
    --functions-version 4 `
    --os-type Linux `
    --storage-account $StorageAccountName `
    --app-insights $AppInsightsName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App created" -ForegroundColor Green
} else {
    Write-Host "❌ Function App creation failed" -ForegroundColor Red
    exit 1
}

# Configure Function App Settings
Write-Host "`n⚙️  Configuring Function App settings..." -ForegroundColor Yellow

# Prompt for database connection string
Write-Host "`n🔐 Database Configuration" -ForegroundColor Cyan
$useExisting = Read-Host "Use existing database connection? (Y/N)"
if ($useExisting -eq "Y" -or $useExisting -eq "y") {
    $dbConnectionString = "Host=mcl-lms-dev.postgres.database.azure.com;Port=5432;Database=postgres;Username=mcladmin;Password=Seattle@2025;SSL Mode=Require;Trust Server Certificate=true;Search Path=quiz"
} else {
    Write-Host "Enter PostgreSQL connection string:"
    $dbConnectionString = Read-Host
}

# Generate secure JWT secret
$jwtSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$swaggerKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))

Write-Host "`n✅ Generated secure keys" -ForegroundColor Green
Write-Host "  JWT Secret: $jwtSecret" -ForegroundColor Gray
Write-Host "  Swagger Key: $swaggerKey" -ForegroundColor Gray

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings `
        "Db__ConnectionString=$dbConnectionString" `
        "JWT__Secret=$jwtSecret" `
        "JWT__Issuer=QuizApp" `
        "JWT__Audience=QuizAppUsers" `
        "JWT__ExpirationMinutes=60" `
        "SwaggerPath=/internal-docs" `
        "SwaggerAuthKey=$swaggerKey" `
        "APPINSIGHTS_INSTRUMENTATIONKEY=$instrumentationKey" `
        "FUNCTIONS_WORKER_RUNTIME=dotnet-isolated"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App configured" -ForegroundColor Green
} else {
    Write-Host "❌ Configuration failed" -ForegroundColor Red
}

# Configure CORS for local development
Write-Host "`n🌐 Configuring CORS..." -ForegroundColor Yellow
az functionapp cors add `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --allowed-origins "http://localhost:5173" "http://localhost:3000"

Write-Host "✅ CORS configured for local development" -ForegroundColor Green

# Create Static Web App
Write-Host "`n📦 Creating Static Web App..." -ForegroundColor Yellow
az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Free

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Static Web App created" -ForegroundColor Green
} else {
    Write-Host "❌ Static Web App creation failed" -ForegroundColor Red
}

# Get deployment token
$deploymentToken = az staticwebapp secrets list `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" `
    --output tsv

# Get URLs
$functionUrl = az functionapp show `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --query "defaultHostName" `
    --output tsv

$swaUrl = az staticwebapp show `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --query "defaultHostname" `
    --output tsv

# Update Function App CORS with Static Web App URL
Write-Host "`n🌐 Adding Static Web App to CORS..." -ForegroundColor Yellow
az functionapp cors add `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --allowed-origins "https://$swaUrl"

Write-Host "✅ CORS updated with production URL" -ForegroundColor Green

# Summary
Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Azure Resources Created Successfully!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 Resource Details:" -ForegroundColor Yellow
Write-Host "  Resource Group:    $ResourceGroup" -ForegroundColor White
Write-Host "  Location:          $Location" -ForegroundColor White
Write-Host "`n  Function App:      $FunctionAppName" -ForegroundColor White
Write-Host "    URL:             https://$functionUrl" -ForegroundColor Gray
Write-Host "`n  Static Web App:    $StaticWebAppName" -ForegroundColor White
Write-Host "    URL:             https://$swaUrl" -ForegroundColor Gray
Write-Host "`n  Storage Account:   $StorageAccountName" -ForegroundColor White
Write-Host "  App Insights:      $AppInsightsName" -ForegroundColor White

Write-Host "`n🔐 Security Keys (SAVE THESE!):" -ForegroundColor Yellow
Write-Host "  JWT Secret:        $jwtSecret" -ForegroundColor Gray
Write-Host "  Swagger Key:       $swaggerKey" -ForegroundColor Gray
Write-Host "  SWA Deploy Token:  $deploymentToken" -ForegroundColor Gray

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy your code:" -ForegroundColor White
Write-Host "     .\Deploy-Azure.ps1 -FunctionAppName $FunctionAppName -ResourceGroup $ResourceGroup -StaticWebAppName $StaticWebAppName" -ForegroundColor Gray
Write-Host "`n  2. Test Function App:" -ForegroundColor White
Write-Host "     curl https://$functionUrl/api/health" -ForegroundColor Gray
Write-Host "`n  3. Visit your app:" -ForegroundColor White
Write-Host "     https://$swaUrl" -ForegroundColor Gray

Write-Host "`n📖 Full documentation: DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
