# Token Refresh Implementation

## Overview

Implemented automatic token refresh functionality to seamlessly renew expired access tokens without forcing users to log in again.

---

## How It Works

### 1. **Login Flow**
When user logs in, both tokens are stored:
```javascript
{
  "token": "eyJhbG...",           // Access token (short-lived, e.g., 15 min)
  "refreshToken": "dGhpcyBp...",  // Refresh token (long-lived, e.g., 7 days)
  "userId": "...",
  "email": "...",
  "roles": [...]
}
```

**Stored in localStorage:**
- `authToken` - Access token for API calls
- `refreshToken` - Refresh token for getting new access token
- `user` - User data (userId, email, firstName, lastName, roles)

---

### 2. **Automatic Token Refresh on 401**

**When access token expires:**
1. API call returns 401 Unauthorized
2. Interceptor catches the error
3. Calls `/v1/auth/refresh-token` with refresh token
4. Receives new access token (and optionally new refresh token)
5. Updates localStorage with new tokens
6. Retries the original failed request automatically
7. User continues working without interruption

**If refresh fails (refresh token expired/invalid):**
1. Clear all localStorage data
2. Redirect user to login page

---

### 3. **Request Queueing**

**Prevents multiple simultaneous refresh attempts:**
- If multiple API calls fail at the same time (all 401)
- Only ONE refresh request is made
- Other failed requests are queued
- Once new token is received, all queued requests retry with new token

**Benefits:**
- Avoids race conditions
- Efficient (one refresh for multiple failures)
- Seamless user experience

---

## Implementation Details

### Files Modified

#### 1. **`src/services/authApi.js`**

**Added refresh token method:**
```javascript
refreshToken: async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await authClient.post('/v1/auth/refresh-token', { refreshToken });
  
  // Update tokens in localStorage
  localStorage.setItem('authToken', response.data.token);
  if (response.data?.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
  
  return response.data;
}
```

**Updated login to store refresh token:**
```javascript
login: async (credentials) => {
  const response = await authClient.post('/v1/auth/login', credentials);
  
  localStorage.setItem('authToken', response.data.token);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  const { token, refreshToken, ...userData } = response.data;
  localStorage.setItem('user', JSON.stringify(userData));
}
```

**Updated response interceptor:**
```javascript
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Try to refresh token
      const response = await authClient.post('/v1/auth/refresh-token', { refreshToken });
      
      // Update token and retry original request
      localStorage.setItem('authToken', response.data.token);
      originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
      return authClient(originalRequest);
    }
  }
);
```

**Updated logout:**
```javascript
logout: () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');  // NEW
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
}
```

---

#### 2. **`src/services/api.js`** (Main Quiz API)

**Added same token refresh logic:**
- Request queueing to prevent multiple refresh attempts
- Automatic retry of failed requests after refresh
- Separate axios instance for refresh call (avoids interceptor loop)
- Uses `VITE_AUTH_API_URL` for refresh endpoint

**Key difference from authApi.js:**
```javascript
// Creates separate client for refresh to avoid interceptor conflicts
const authClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const response = await authClient.post('/v1/auth/refresh-token', { refreshToken });
```

---

#### 3. **`src/context/AuthContext.jsx`**

**Updated login to handle refresh token:**
```javascript
const login = async (credentials, rememberMe = false) => {
  const response = await authApi.login(credentials);
  
  // Extract user data (exclude token and refreshToken)
  const { token, refreshToken, ...userData } = response;
  setUser(userData);
  setIsAuthenticated(true);
}
```

---

## API Endpoint Requirements

### Backend must provide:

**POST `/v1/auth/refresh-token`**

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4="
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "bmV3IHJlZnJlc2ggdG9rZW4="  // Optional: new refresh token
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid or expired refresh token"
}
```

---

## Security Considerations

### ✅ **Implemented**
1. **Short-lived access tokens** - Limits damage if token is stolen
2. **Refresh token rotation** - New refresh token issued with each refresh
3. **Automatic cleanup** - All tokens cleared on refresh failure
4. **Logout clears all tokens** - No orphaned tokens in storage

### 🔒 **Recommended (Backend)**
1. **Refresh token revocation** - Store refresh tokens in database
2. **One-time use refresh tokens** - Invalidate after use
3. **Refresh token family tracking** - Detect token reuse (possible theft)
4. **Device/IP binding** - Limit refresh token to specific device/IP
5. **Sliding expiration** - Extend refresh token expiration on use

---

## Testing

### Test Scenarios:

**1. Normal Login**
```javascript
// Login with credentials
const result = await login({ email, password });

// Check localStorage
localStorage.getItem('authToken')      // ✓ Present
localStorage.getItem('refreshToken')   // ✓ Present
localStorage.getItem('user')           // ✓ Present
```

**2. Access Token Expiration**
```javascript
// Wait for access token to expire (or manually expire it)
// Make any API call

// Expected behavior:
// 1. API returns 401
// 2. Interceptor catches 401
// 3. Calls refresh-token endpoint
// 4. Updates authToken in localStorage
// 5. Retries original request
// 6. Request succeeds with new token
```

**3. Refresh Token Expiration**
```javascript
// Wait for refresh token to expire
// Make any API call after access token expires

// Expected behavior:
// 1. API returns 401
// 2. Interceptor tries to refresh
// 3. Refresh endpoint returns 401 (refresh token expired)
// 4. Clears all localStorage
// 5. Redirects to /login
```

**4. Multiple Simultaneous Requests**
```javascript
// Make multiple API calls at once with expired access token
Promise.all([
  quizApi.getQuizzes(),
  quizApi.getQuestions(),
  quizApi.getPlayers()
]);

// Expected behavior:
// 1. All 3 requests fail with 401
// 2. Only 1 refresh-token call is made
// 3. Other 2 requests are queued
// 4. After refresh, all 3 requests retry
// 5. All 3 requests succeed
```

---

## User Experience

### ✅ **Seamless Session Extension**
- User never sees "Please login again" unless refresh token expires
- No interruption during active usage
- Background token refresh is invisible to user

### ✅ **Security Without Friction**
- Short access token lifetime (high security)
- Long refresh token lifetime (good UX)
- Balance between security and convenience

### ⏱️ **Typical Token Lifetimes**
- **Access Token:** 15 minutes - 1 hour
- **Refresh Token:** 7 days - 30 days
- **Session:** As long as refresh token is valid and user is active

---

## Troubleshooting

### Issue: "Token refresh loop"
**Symptom:** Infinite refresh attempts  
**Cause:** Refresh endpoint also requires authentication  
**Solution:** Use separate axios instance without interceptors for refresh call ✅ (Already implemented)

### Issue: "Multiple refresh calls"
**Symptom:** Multiple simultaneous refresh requests  
**Cause:** Multiple API calls failing at the same time  
**Solution:** Request queueing with `isRefreshing` flag ✅ (Already implemented)

### Issue: "User logged out unexpectedly"
**Symptom:** User redirected to login during active session  
**Cause:** Refresh token expired or invalid  
**Solution:** Check refresh token lifetime on backend, consider sliding expiration

---

## Configuration

### Environment Variables
```bash
# .env
VITE_AUTH_API_URL=http://localhost:7072/api  # LMS API with refresh endpoint
VITE_API_URL=http://localhost:7071/api        # Quiz API
```

### Backend Token Lifetimes (Example)
```csharp
// JWT Access Token
var accessToken = new JwtSecurityToken(
    expires: DateTime.UtcNow.AddMinutes(15)  // 15 minutes
);

// Refresh Token
var refreshToken = new RefreshToken {
    Token = GenerateSecureToken(),
    ExpiresAt = DateTime.UtcNow.AddDays(7)   // 7 days
};
```

---

## Next Steps

### Recommended Enhancements:
1. ✅ **Token refresh implemented**
2. ⏳ **Add token expiration monitoring** - Proactively refresh before expiration
3. ⏳ **Add offline support** - Queue requests when offline, retry when back online
4. ⏳ **Add refresh token revocation endpoint** - Allow user to logout all devices
5. ⏳ **Add "Remember Me" duration** - Different refresh token lifetime based on checkbox

---

## Summary

✅ **Access Token:** Short-lived, used for API calls  
✅ **Refresh Token:** Long-lived, used to get new access token  
✅ **Automatic Refresh:** Transparent to user  
✅ **Request Queueing:** Prevents refresh loops  
✅ **Secure Logout:** Clears all tokens  

**Result:** Secure, seamless authentication with excellent user experience! 🎉
