# 🔐 GitHub Secrets Configuration Guide

## Required Secrets for GitHub Actions Deployment

To deploy your application automatically via GitHub Actions, you need to configure the following secrets in your GitHub repository.

---

## 📍 How to Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/BharadwajSarma/Quizz`
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button
5. Add each secret below

---

## 🔑 Required Secrets

### 1. AZURE_STATIC_WEB_APPS_API_TOKEN

**What it is:** Deployment token for your Azure Static Web App

**How to get it:**

#### Option A: Via Azure Portal
1. Go to Azure Portal → Your Static Web App
2. Click on **Manage deployment token** (in Overview)
3. Copy the token

#### Option B: Via Azure CLI
```powershell
az staticwebapp secrets list `
  --name swa-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --query "properties.apiKey" `
  --output tsv
```

**Add to GitHub:**
- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Value: `[paste the token here]`

---

### 2. VITE_API_URL

**What it is:** The URL of your deployed Azure Functions API

**How to get it:**

#### Option A: Via Azure Portal
1. Go to Azure Portal → Your Function App
2. Copy the URL from Overview (e.g., `https://func-quizapp-prod.azurewebsites.net`)

#### Option B: Via Azure CLI
```powershell
$functionUrl = az functionapp show `
  --name func-quizapp-prod `
  --resource-group rg-quizapp-prod `
  --query "defaultHostName" `
  --output tsv

Write-Host "https://$functionUrl/api"
```

**Add to GitHub:**
- Name: `VITE_API_URL`
- Value: `https://func-quizapp-prod.azurewebsites.net/api`

---

## ✅ Verify Secrets Are Set

After adding secrets, you should see:
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN`
- ✅ `VITE_API_URL`
- ✅ `GITHUB_TOKEN` (automatically available, no need to add)

---

## 🚀 Trigger Deployment

Once secrets are configured, deployment will trigger automatically when you:

### Option 1: Push to Main Branch
```powershell
git add .
git commit -m "feat: configure GitHub Actions deployment"
git push origin main
```

### Option 2: Manual Trigger
1. Go to GitHub → **Actions** tab
2. Select **Azure Static Web Apps CI/CD** workflow
3. Click **Run workflow** button
4. Select branch: `main`
5. Click **Run workflow**

---

## 📊 Monitor Deployment

1. Go to GitHub → **Actions** tab
2. Click on the latest workflow run
3. Expand **Build and Deploy Job**
4. Watch the deployment progress

**Expected steps:**
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Build application
- ✅ Deploy to Azure Static Web Apps

---

## 🐛 Troubleshooting

### Error: "The app build failed to produce artifact folder"
**Solution:** ✅ Already fixed! The workflow now uses `dist` folder and `skip_app_build: true`

### Error: "EBADENGINE Unsupported engine"
**Solution:** ✅ Already fixed! The workflow now uses Node.js 20.x

### Error: "azure_static_web_apps_api_token is required"
**Solution:** Make sure you added the secret `AZURE_STATIC_WEB_APPS_API_TOKEN` to GitHub

### Error: "401 Unauthorized"
**Solution:** Your deployment token might be invalid. Get a new one:
```powershell
az staticwebapp secrets list --name swa-quizapp-prod --resource-group rg-quizapp-prod --query "properties.apiKey" -o tsv
```

### Error: Build fails during npm install
**Solution:** Check if your `package.json` and `package-lock.json` are in sync:
```powershell
cd quiz-app
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
git push
```

---

## 🔄 Update Secrets

If you need to change a secret:
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Click on the secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**

---

## 📝 Quick Command Reference

### Get Static Web App Deployment Token
```powershell
az staticwebapp secrets list `
  --name YOUR_SWA_NAME `
  --resource-group YOUR_RG_NAME `
  --query "properties.apiKey" -o tsv
```

### Get Function App URL
```powershell
az functionapp show `
  --name YOUR_FUNCTION_NAME `
  --resource-group YOUR_RG_NAME `
  --query "defaultHostName" -o tsv
```

### Test Secrets Are Working
```powershell
# This will show *** for configured secrets
gh secret list
```

---

## 🎯 Next Steps After Deployment

1. **Wait for deployment to complete** (usually 2-5 minutes)
2. **Get your Static Web App URL:**
   ```powershell
   az staticwebapp show --name swa-quizapp-prod --resource-group rg-quizapp-prod --query "defaultHostname" -o tsv
   ```
3. **Visit your deployed app:** `https://your-swa-url.azurestaticapps.net`
4. **Test the application:**
   - Check if the role selector loads
   - Try navigating to different sections
   - Check browser console for errors
5. **Configure CORS on Function App** (if not done):
   ```powershell
   az functionapp cors add `
     --name func-quizapp-prod `
     --resource-group rg-quizapp-prod `
     --allowed-origins "https://your-swa-url.azurestaticapps.net"
   ```

---

## 💰 Cost Impact

GitHub Actions usage:
- **Free tier:** 2,000 minutes/month for public repos
- **Free tier:** 500 MB storage
- Your workflow typically takes 2-3 minutes per deployment
- **Cost:** $0 for most use cases

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps Deploy Action](https://github.com/Azure/static-web-apps-deploy)
- [Managing GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Need help?** Check the Actions tab in GitHub for detailed error logs.
