# 🚀 Azure Deployment Guide - Quiz Application

## Overview
This guide will help you deploy your Quiz Application to Azure with:
- **Azure Functions** (Backend API - .NET 8)
- **Azure Static Web App** (Frontend - React)
- **Azure Database for PostgreSQL** (Already configured)

---

## Prerequisites

✅ **Required Tools:**
- Azure CLI: https://aka.ms/install-azure-cli
- Azure Functions Core Tools: https://aka.ms/azfunc-install
- Static Web Apps CLI: `npm install -g @azure/static-web-apps-cli`
- .NET 8 SDK
- Node.js 18+

✅ **Azure Account:**
- Active Azure subscription
- Contributor access to resource group

---

## 🎯 Deployment Steps

### Step 1: Login to Azure

```powershell
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify
az account show
```

### Step 2: Create Resource Group (if not exists)

```powershell
# Create resource group in your preferred region
az group create --name rg-quizapp-prod --location eastus
```

### Step 3: Deploy Azure Functions

#### Option A: Using Azure Portal (Easiest)

1. **Create Function App:**
   - Go to Azure Portal → Create Resource → Function App
   - **Basics:**
     - Function App name: `func-quizapp-prod` (must be globally unique)
     - Runtime: `.NET`
     - Version: `8 (LTS) Isolated`
     - Region: Same as your PostgreSQL (e.g., East US)
     - Operating System: `Linux` (recommended)
     - Plan: `Flex Consumption` (FC1) - Best for production
   - **Storage:** Create new or use existing
   - **Networking:** Configure if needed
   - Click **Review + Create**

2. **Configure Application Settings:**
   - Go to your Function App → Configuration → Application Settings
   - Add these settings:

   ```
   PostgresConnectionString = Host=mcl-lms-dev.postgres.database.azure.com;Port=5432;Database=postgres;Username=mcladmin;Password=Seattle@2025;SSL Mode=Require;Trust Server Certificate=true;Search Path=quiz
   
   JWT__Secret = your-super-secret-jwt-key-at-least-32-characters-long-change-this-in-production
   JWT__Issuer = QuizApp
   JWT__Audience = QuizAppUsers
   JWT__ExpirationMinutes = 60
   
   SwaggerPath = /internal-docs
   SwaggerAuthKey = your-secret-swagger-key-change-this
   
   FUNCTIONS_WORKER_RUNTIME = dotnet-isolated
   ```

   **⚠️ IMPORTANT:** Replace `JWT__Secret` and `SwaggerAuthKey` with secure values!

3. **Enable CORS:**
   - Go to Function App → CORS
   - Add your Static Web App URL (we'll get this in Step 4)
   - Add `http://localhost:5173` for local testing

4. **Deploy Function Code:**

```powershell
# Navigate to Functions folder
cd C:\Quizz\Functions

# Build and publish
dotnet publish --configuration Release --output ./publish

# Deploy to Azure (replace with your function app name)
func azure functionapp publish func-quizapp-prod
```

#### Option B: Using Azure CLI

```powershell
# Create storage account
az storage account create --name stquizappprod --resource-group rg-quizapp-prod --location eastus --sku Standard_LRS

# Create Function App with Flex Consumption plan
az functionapp create `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --consumption-plan-location eastus `
  --runtime dotnet-isolated `
  --runtime-version 8 `
  --functions-version 4 `
  --os-type Linux `
  --storage-account stquizappprod

# Configure app settings
az functionapp config appsettings set `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --settings `
    "PostgresConnectionString=Host=mcl-lms-dev.postgres.database.azure.com;Port=5432;Database=postgres;Username=mcladmin;Password=Seattle@2025;SSL Mode=Require;Trust Server Certificate=true;Search Path=quiz" `
    "JWT__Secret=your-super-secret-jwt-key-at-least-32-characters-long" `
    "JWT__Issuer=QuizApp" `
    "JWT__Audience=QuizAppUsers" `
    "JWT__ExpirationMinutes=60" `
    "SwaggerPath=/internal-docs" `
    "SwaggerAuthKey=your-secret-key"

# Deploy
cd C:\Quizz\Functions
func azure functionapp publish func-quizapp-prod
```

### Step 4: Deploy Static Web App (Frontend)

#### 4.1: Update Frontend Configuration

First, update the API URL in your React app:

```powershell
cd C:\Quizz\quiz-app
```

Create/update `.env.production`:
```env
VITE_API_URL=https://func-quizapp-prod.azurewebsites.net/api
```

#### 4.2: Initialize Static Web App

```powershell
# Install SWA CLI globally
npm install -g @azure/static-web-apps-cli

# Initialize SWA config
npx swa init --yes
```

This creates `swa-cli.config.json`

#### 4.3: Build the App

```powershell
# Install dependencies
npm install

# Build for production
npm run build
```

#### 4.4: Create Static Web App in Azure

**Using Azure Portal:**
1. Go to Azure Portal → Create Resource → Static Web App
2. **Basics:**
   - Name: `swa-quizapp-prod`
   - Region: East US
   - Hosting plan: Free or Standard
   - Deployment: GitHub (or Other for manual)
3. Click **Review + Create**

**Using Azure CLI:**
```powershell
az staticwebapp create `
  --name swa-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --location eastus `
  --source https://github.com/BharadwajSarma/Quizz `
  --branch main `
  --app-location "/quiz-app" `
  --output-location "dist" `
  --token YOUR_GITHUB_TOKEN
```

#### 4.5: Get Deployment Token

```powershell
# Get deployment token
az staticwebapp secrets list --name swa-quizapp-prod --resource-group rg-quizapp-prod --query properties.apiKey --output tsv
```

Save this token!

#### 4.6: Deploy the App

```powershell
# Deploy using SWA CLI
npx swa deploy ./dist --deployment-token YOUR_DEPLOYMENT_TOKEN --env production
```

Or manually upload `dist` folder via Azure Portal.

### Step 5: Update CORS on Function App

Now that you have your Static Web App URL, add it to Function App CORS:

```powershell
# Get your Static Web App URL
az staticwebapp show --name swa-quizapp-prod --resource-group rg-quizapp-prod --query defaultHostname --output tsv

# Add to CORS (replace with your actual URL)
az functionapp cors add `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --allowed-origins https://your-swa-url.azurestaticapps.net
```

Or configure via Portal:
- Function App → CORS → Add URL

### Step 6: Test Your Deployment

1. **Test Backend API:**
```powershell
# Check if Functions are running
curl https://func-quizapp-prod.azurewebsites.net/api/health
```

2. **Test Frontend:**
   - Visit: `https://swa-quizapp-prod.azurestaticapps.net`
   - Try logging in
   - Check browser console for errors

---

## 🔒 Security Best Practices

### 1. Secure Configuration

**Store secrets in Azure Key Vault:**
```powershell
# Create Key Vault
az keyvault create --name kv-quizapp-prod --resource-group rg-quizapp-prod

# Store secrets
az keyvault secret set --vault-name kv-quizapp-prod --name PostgresConnectionString --value "YOUR_CONNECTION_STRING"
az keyvault secret set --vault-name kv-quizapp-prod --name JWTSecret --value "YOUR_JWT_SECRET"

# Grant Function App access
az functionapp identity assign --name func-quizapp-prod --resource-group rg-quizapp-prod

# Get the identity
$identity = az functionapp identity show --name func-quizapp-prod --resource-group rg-quizapp-prod --query principalId -o tsv

# Set access policy
az keyvault set-policy --name kv-quizapp-prod --object-id $identity --secret-permissions get list
```

**Update Function App settings to use Key Vault:**
```powershell
az functionapp config appsettings set `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --settings `
    "PostgresConnectionString=@Microsoft.KeyVault(SecretUri=https://kv-quizapp-prod.vault.azure.net/secrets/PostgresConnectionString/)" `
    "JWT__Secret=@Microsoft.KeyVault(SecretUri=https://kv-quizapp-prod.vault.azure.net/secrets/JWTSecret/)"
```

### 2. Enable Application Insights

```powershell
# Create Application Insights
az monitor app-insights component create `
  --app ai-quizapp-prod `
  --location eastus `
  --resource-group rg-quizapp-prod

# Get instrumentation key
$insightsKey = az monitor app-insights component show --app ai-quizapp-prod --resource-group rg-quizapp-prod --query instrumentationKey -o tsv

# Configure Function App
az functionapp config appsettings set `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$insightsKey"
```

### 3. Configure PostgreSQL Firewall

```powershell
# Allow Azure services
az postgres server firewall-rule create `
  --resource-group YOUR_PG_RESOURCE_GROUP `
  --server-name mcl-lms-dev `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

---

## 📊 Monitoring

### View Logs

**Function App Logs:**
```powershell
az functionapp log tail --name func-quizapp-prod --resource-group rg-quizapp-prod
```

**Static Web App Logs:**
```powershell
az staticwebapp show --name swa-quizapp-prod --resource-group rg-quizapp-prod
```

### Application Insights Dashboard

- Go to Azure Portal → Application Insights → ai-quizapp-prod
- View: Performance, Failures, Live Metrics

---

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Build Functions
        run: |
          cd Functions
          dotnet restore
          dotnet build --configuration Release
          dotnet publish --configuration Release --output ./publish
      
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: func-quizapp-prod
          package: Functions/publish
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Static Web App
        run: |
          cd quiz-app
          npm ci
          npm run build
      
      - name: Deploy to Azure Static Web App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/quiz-app"
          output_location: "dist"
```

---

## 🐛 Troubleshooting

### Function App not starting
- Check Application Insights for errors
- Verify connection strings in Configuration
- Check that PostgreSQL allows Azure connections

### CORS errors
- Verify Static Web App URL is in Function App CORS settings
- Check browser console for exact error
- Ensure credentials are not being sent (CORSCredentials: false)

### Database connection fails
- Verify PostgreSQL firewall rules
- Test connection string locally
- Check SSL requirements

### Deployment fails
- Run `azd down` to clean up
- Try deploying again
- Check Azure CLI version: `az --version`

---

## 💰 Cost Estimation

**Monthly costs (approximate):**
- Azure Functions (Flex Consumption): $0-50 (pay per execution)
- Static Web App: Free tier or $9/month
- PostgreSQL: Already deployed
- Application Insights: Free tier (1GB data/month)

**Total: ~$10-60/month** depending on usage

---

## 📚 Additional Resources

- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure PostgreSQL Documentation](https://learn.microsoft.com/azure/postgresql/)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

## ✅ Deployment Checklist

- [ ] Azure CLI installed
- [ ] Logged into Azure
- [ ] Resource group created
- [ ] Function App created and configured
- [ ] Database connection verified
- [ ] JWT secrets configured
- [ ] Function App deployed
- [ ] Static Web App created
- [ ] Frontend built and deployed
- [ ] CORS configured
- [ ] Application Insights enabled
- [ ] Tested login functionality
- [ ] Tested API endpoints
- [ ] Monitored logs for errors

---

## 🎉 Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up staging environments
4. Configure backup strategies
5. Set up monitoring alerts
6. Document API for team

---

**Need help?** Check the troubleshooting section or reach out to your Azure administrator.
