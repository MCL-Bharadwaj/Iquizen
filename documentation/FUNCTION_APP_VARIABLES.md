# Function App Environment Variables - Copy & Paste

## Add these to: quizz (Function App) → Environment variables

Click "+ Add" for each setting and copy the exact values:

---

### 1. PostgresConnectionString
```
Host=mcl-lms-dev.postgres.database.azure.com;Port=5432;Database=postgres;Username=mcladmin;Password=Seattle@2025;SSL Mode=Require;Trust Server Certificate=true;Search Path=quiz
```

---

### 2. JWT__Secret
```
your-super-secret-jwt-key-minimum-32-characters-long-change-in-production-2024
```

---

### 3. JWT__Issuer
```
QuizApp
```

---

### 4. JWT__Audience
```
QuizAppUsers
```

---

### 5. JWT__ExpirationMinutes
```
60
```

---

### 6. SwaggerPath
```
/internal-docs
```

---

### 7. SwaggerAuthKey
```
change-this-swagger-secret-key-for-production
```

---

## ⚠️ IMPORTANT NOTES:

1. **Double underscores** in JWT settings: `JWT__Secret`, `JWT__Issuer`, etc. (not single underscore)
2. **Click "Apply"** at the bottom after adding all variables
3. Wait for the **"Success"** notification
4. Function App will **restart automatically** (takes ~30 seconds)

---

## ✅ After Adding Variables:

1. Go to Function App → Overview
2. Click "Restart" if needed
3. Wait 30-60 seconds
4. Test API: https://quizz-huejbxd2dpaccbb0.westus3-01.azurewebsites.net/api
5. Check Swagger: https://quizz-huejbxd2dpaccbb0.westus3-01.azurewebsites.net/internal-docs

---

## 🔒 Production Security (TODO Later):

⚠️ Current values are for testing only. For production:
- Generate a strong 64+ character JWT secret
- Use Azure Key Vault for secrets
- Use managed identity for database connection
- Change Swagger key or disable Swagger endpoint
