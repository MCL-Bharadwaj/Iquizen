# 🚀 Quick Deployment Commands

## Option 1: Automated Setup (Recommended for First Time)

### Create all Azure resources:
```powershell
.\Setup-Azure-Resources.ps1 -ResourceGroup "rg-quizapp-prod" -Location "eastus" -AppName "quizapp-prod"
```

This creates:
- ✅ Resource Group
- ✅ Function App (with .NET 8)
- ✅ Static Web App
- ✅ Storage Account
- ✅ Application Insights
- ✅ Configures all settings
- ✅ Sets up CORS

### Deploy your code:
```powershell
.\Deploy-Azure.ps1 -FunctionAppName "func-quizapp-prod" -ResourceGroup "rg-quizapp-prod" -StaticWebAppName "swa-quizapp-prod"
```

---

## Option 2: Manual Azure Portal Setup

### 1. Create Function App in Portal
- Go to Azure Portal → Create Resource → Function App
- Name: `func-quizapp-prod`
- Runtime: `.NET` version `8 (LTS) Isolated`
- OS: `Linux`
- Plan: `Flex Consumption (FC1)`

### 2. Configure App Settings
Add in Configuration → Application Settings:
```
Db__ConnectionString = Host=mcl-lms-dev.postgres.database.azure.com;Port=5432;Database=postgres;Username=mcladmin;Password=Seattle@2025;SSL Mode=Require;Trust Server Certificate=true;Search Path=quiz

JWT__Secret = [Generate 32+ character secret]
JWT__Issuer = QuizApp
JWT__Audience = QuizAppUsers
JWT__ExpirationMinutes = 60
SwaggerPath = /internal-docs
SwaggerAuthKey = [Generate secret key]
FUNCTIONS_WORKER_RUNTIME = dotnet-isolated
```

### 3. Deploy Functions
```powershell
cd C:\Quizz\Functions
dotnet publish --configuration Release --output ./publish
func azure functionapp publish func-quizapp-prod
```

### 4. Create Static Web App
- Go to Azure Portal → Create Resource → Static Web App
- Name: `swa-quizapp-prod`
- Plan: `Free` or `Standard`

### 5. Update Frontend Config
Edit `quiz-app/.env.production`:
```
VITE_API_URL=https://func-quizapp-prod.azurewebsites.net/api
```

### 6. Deploy Frontend
```powershell
cd C:\Quizz\quiz-app
npm install
npm run build

# Get deployment token from Portal
npx swa deploy ./dist --deployment-token YOUR_TOKEN --env production
```

### 7. Configure CORS
In Function App → CORS, add:
- `https://your-swa-url.azurestaticapps.net`
- `http://localhost:5173` (for testing)

---

## Quick Deploy (After Initial Setup)

### Deploy Functions only:
```powershell
cd C:\Quizz\Functions
func azure functionapp publish func-quizapp-prod
```

### Deploy Frontend only:
```powershell
cd C:\Quizz\quiz-app
npm run build
npx swa deploy ./dist --deployment-token YOUR_TOKEN --env production
```

### Deploy Both:
```powershell
.\Deploy-Azure.ps1 -FunctionAppName "func-quizapp-prod" -ResourceGroup "rg-quizapp-prod" -StaticWebAppName "swa-quizapp-prod"
```

---

## Testing

### Test API:
```powershell
curl https://func-quizapp-prod.azurewebsites.net/api/health
```

### Test Login:
```powershell
curl -X POST https://func-quizapp-prod.azurewebsites.net/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

### View Logs:
```powershell
az functionapp log tail --name func-quizapp-prod --resource-group rg-quizapp-prod
```

---

## Troubleshooting

### Function App won't start:
```powershell
# Check logs
az functionapp log tail --name func-quizapp-prod --resource-group rg-quizapp-prod

# Restart
az functionapp restart --name func-quizapp-prod --resource-group rg-quizapp-prod
```

### CORS errors:
```powershell
# Add origin
az functionapp cors add --name func-quizapp-prod --resource-group rg-quizapp-prod --allowed-origins "https://your-url.com"
```

### Database connection fails:
```powershell
# Test connection string
az postgres server show --resource-group YOUR_RG --name mcl-lms-dev
```

---

## Useful Commands

### Get Function App URL:
```powershell
az functionapp show --name func-quizapp-prod --resource-group rg-quizapp-prod --query "defaultHostName" -o tsv
```

### Get Static Web App URL:
```powershell
az staticwebapp show --name swa-quizapp-prod --resource-group rg-quizapp-prod --query "defaultHostname" -o tsv
```

### Get SWA Deployment Token:
```powershell
az staticwebapp secrets list --name swa-quizapp-prod --resource-group rg-quizapp-prod --query "properties.apiKey" -o tsv
```

### View all resources:
```powershell
az resource list --resource-group rg-quizapp-prod --output table
```

---

## Cost Management

### View costs:
```powershell
az consumption usage list --start-date 2025-11-01 --end-date 2025-11-30
```

### Set budget alerts in Azure Portal:
Cost Management → Budgets → Create Budget

---

## Clean Up (Delete Everything)

### Delete entire resource group:
```powershell
az group delete --name rg-quizapp-prod --yes --no-wait
```

⚠️ This deletes ALL resources in the group!

---

**Full Documentation:** See `DEPLOYMENT_GUIDE.md`
