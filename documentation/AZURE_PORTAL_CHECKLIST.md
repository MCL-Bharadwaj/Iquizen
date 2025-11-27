# ✅ Azure Portal GitHub Integration Checklist

## 🎯 Your Settings

**Static Web App:** MCL-quizz  
**Resource Group:** LMSDev  
**Function App:** quizz  

---

## 📋 Configuration Checklist

### Step 1: Azure Portal Setup
- [ ] Go to https://portal.azure.com
- [ ] Search and open "MCL-quizz"
- [ ] Click "Configuration" (or "Overview" → "Manage deployment token")

### Step 2: GitHub Connection
- [ ] Click "Connect to GitHub" (if not connected)
- [ ] Authorize Azure Static Web Apps
- [ ] Select:
  - Organization: **BharadwajSarma**
  - Repository: **Quizz**
  - Branch: **main**
- [ ] Build preset: **Custom** or **React**

### Step 3: Build Configuration
Enter these EXACT values:
```
App location:     /quiz-app
Api location:     (leave empty)
Output location:  dist
```
- [ ] Verify values are correct
- [ ] Click "Save"

### Step 4: Environment Variables
- [ ] Go to "Configuration" → "Application settings" tab
- [ ] Click "+ Add"
- [ ] Add setting:
  ```
  Name:  VITE_API_URL
  Value: https://quizz-huejbxd2dpaccbb0.westus3-01.azurewebsites.net/api
  ```
- [ ] Click "OK"
- [ ] Click "Save" at top

### Step 5: Configure CORS on Function App
- [ ] Go to Function App: "quizz"
- [ ] Click "CORS" in left menu
- [ ] Add allowed origin:
  ```
  https://nice-grass-02563cc1e.5.azurestaticapps.net
  ```
  (Get exact URL from Static Web App Overview)
- [ ] Click "Save"

---

## 🚀 Deployment

### What Happens Automatically:
1. ✅ Azure creates GitHub Actions workflow
2. ✅ Commits to `.github/workflows/` folder
3. ✅ Triggers first deployment
4. ✅ Future pushes to `main` auto-deploy

### Monitor Progress:
- **GitHub:** https://github.com/BharadwajSarma/Quizz/actions
- **Azure Portal:** MCL-quizz → "Deployment" → "Deployment history"

### Expected Timeline:
- Configuration: 2-3 minutes
- First deployment: 3-5 minutes
- Total: ~5-8 minutes

---

## 🌐 Access Your App

**Frontend URL:**
- Check Azure Portal → MCL-quizz → Overview → URL
- Likely: https://nice-grass-02563cc1e.5.azurestaticapps.net

**Backend API:**
- https://quizz-huejbxd2dpaccbb0.westus3-01.azurewebsites.net/api

---

## ✅ Verify Deployment

### Test Checklist:
- [ ] Visit frontend URL
- [ ] Role selector page loads
- [ ] No console errors (F12)
- [ ] Can navigate to student/tutor/creator routes
- [ ] API calls work (check Network tab)

### If Issues:
1. **Check GitHub Actions:** Look for red X or errors
2. **Check Browser Console:** F12 → Console tab
3. **Check Network Tab:** F12 → Network tab for failed API calls
4. **Verify CORS:** Make sure Static Web App URL is in Function App CORS

---

## 🔄 Future Deployments

Once set up, deployment is automatic:
```bash
# Make changes to your code
git add .
git commit -m "your changes"
git push origin main

# Azure automatically deploys! 🎉
```

---

## 🐛 Troubleshooting

### Deployment Fails
- Check GitHub Actions logs
- Verify build settings in Azure Portal
- Ensure `output_location` is `dist` not `build`

### API Calls Fail (CORS)
- Add Static Web App URL to Function App CORS
- Verify VITE_API_URL is set correctly
- Check Function App is running

### Environment Variable Not Working
- Rebuild after adding VITE_API_URL
- Variables prefixed with `VITE_` are embedded at build time
- Check they appear in browser: `console.log(import.meta.env.VITE_API_URL)`

---

## 📚 Resources

- **Portal:** https://portal.azure.com
- **GitHub Actions:** https://github.com/BharadwajSarma/Quizz/actions
- **Documentation:** See DEPLOYMENT_GUIDE.md

---

**Status:** ⏳ Waiting for configuration  
**Next:** Complete checklist above ☝️
