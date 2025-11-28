# JWT Authentication Flow - Implementation Summary

## Overview
This document explains the JWT-based authentication flow implemented in the IQuizen application, including token decoding, role extraction, and role-based navigation.

## Architecture

### Authentication Servers
- **Auth API**: `http://localhost:7072/api` - Handles login/authentication
- **Main API**: `http://localhost:7071/api` - Handles quiz operations
- **Frontend**: React app with routing

## JWT Token Structure

Based on your decoded token, the JWT payload contains:

```json
{
  "sub": "3f183699-c88d-4ccb-b4a6-3baeb4383512",
  "email": "kk@gmail.com",
  "jti": "0dc635cf-8e15-4a36-adde-13f6f9a50ea7",
  "userId": "3f183699-c88d-4ccb-b4a6-3baeb4383512",
  "role": [
    "Tutors",
    "Administrator",
    "Player"
  ],
  "exp": 1764407716,
  "iss": "LMS-API",
  "aud": "LMS-Users"
}
```

### Key Claims
- **`sub`**: Subject - User ID (alternative to userId)
- **`email`**: User's email address
- **`userId`**: User's unique identifier
- **`role`**: Array of roles (Player, Tutors, Administrator)
- **`exp`**: Expiration timestamp (Unix timestamp)
- **`iss`**: Issuer - "LMS-API"
- **`aud`**: Audience - "LMS-Users"

## Implementation Details

### 1. JWT Decoding Utility (`src/utils/jwtHelper.js`)

Created a comprehensive utility library for JWT operations:

```javascript
import { getRolesFromToken, getUserIdFromToken, isTokenExpired } from '@/utils/jwtHelper';

// Decode entire token
const payload = decodeJWT(token);

// Extract specific data
const userId = getUserIdFromToken(token);
const email = getEmailFromToken(token);
const roles = getRolesFromToken(token);

// Check expiration
const expired = isTokenExpired(token);

// Check role access
const hasAccess = hasRole(token, ['Tutors', 'Administrator']);

// Debug token (development only)
debugToken(token);
```

### 2. Updated Auth Service (`src/services/authApi.js`)

**Key Changes:**
- Added `decodeJWT()` function at the top of the file
- Modified `login()` function to:
  - Decode JWT token after successful login
  - Extract `userId`, `email`, and `roles` from token claims
  - Store enriched user data in localStorage
  - Return complete user data with roles

**Login Flow:**
```javascript
// 1. Call login API
const response = await authClient.post('/v1/auth/login', credentials);

// 2. Decode token
const decodedToken = decodeJWT(response.data.token);

// 3. Extract claims
const userId = decodedToken.userId || decodedToken.sub;
const email = decodedToken.email;
const roles = decodedToken.role; // Array: ["Tutors", "Administrator", "Player"]

// 4. Store in localStorage
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify({
  userId,
  email,
  roles,
  ...otherData
}));

// 5. Return enriched response
return { ...response.data, userId, email, roles };
```

### 3. Updated AuthContext (`src/context/AuthContext.jsx`)

**Key Changes:**
- Ensures roles are properly extracted and stored in user state
- Added logging to track user data with roles
- Returns complete user object including roles array

### 4. Updated Login Pages

#### Auth/LoginPage.jsx (Main Login)
**Navigation Logic:**
```javascript
// After successful login
const roles = userData.roles; // ["Tutors", "Administrator", "Player"]

if (roles.length === 1) {
  // Single role - auto-navigate to dashboard
  if (role === 'Player') 
    navigate('/Player/dashboard');
  else if (role === 'Tutors' || role === 'Administrator') 
    navigate('/creator/dashboard');
} else if (roles.length > 1) {
  // Multiple roles - show role selector
  navigate('/');
}
```

### 5. Updated RoleSelector (`src/pages/RoleSelector.jsx`)

**Key Changes:**
- Imports `useAuth` hook to access user data
- Filters available roles based on user's JWT roles
- Auto-navigates if user has only one role
- Shows only roles the user has access to

**Role Mapping:**
```javascript
const allRoles = [
  {
    id: 'Player',
    requiredRole: 'Player',
    path: '/Player/dashboard',
  },
  {
    id: 'creator',
    requiredRole: ['Tutors', 'Administrator'], // Either role grants access
    path: '/creator/dashboard',
  }
];

// Filter based on user's roles from JWT
const userRoles = ["Tutors", "Administrator", "Player"];
const availableRoles = allRoles.filter(role => 
  userRoles.includes(role.requiredRole) ||
  role.requiredRole.some(r => userRoles.includes(r))
);
```

## User Flow

### Login Process

1. **User enters credentials** on login page
2. **Frontend calls** `POST http://localhost:7072/api/v1/auth/login`
3. **Backend returns** JWT token with embedded claims
4. **Frontend decodes** JWT to extract:
   - User ID
   - Email
   - Roles array
5. **Frontend stores**:
   - Token in `localStorage.authToken`
   - User data in `localStorage.user` (includes roles)
6. **Frontend navigates** based on roles:
   - **Single role**: Direct to dashboard
   - **Multiple roles**: Show role selector
   - **No roles**: Show role selector (fallback)

### Role-Based Access

| User Role | Can Access | Dashboard Path |
|-----------|-----------|----------------|
| Player | Player dashboard | `/Player/dashboard` |
| Tutors | Content Creator dashboard | `/creator/dashboard` |
| Administrator | Content Creator dashboard | `/creator/dashboard` |
| Multiple roles | Role selector page | `/` |

### Navigation Examples

**Example 1: Player Only**
```
Roles: ["Player"]
→ Auto-navigate to: /Player/dashboard
```

**Example 2: Tutor Only**
```
Roles: ["Tutors"]
→ Auto-navigate to: /creator/dashboard
```

**Example 3: Multiple Roles (Your Case)**
```
Roles: ["Tutors", "Administrator", "Player"]
→ Show role selector with options:
   - Player Portal
   - Content Creator Portal
```

## Testing

### Test Login Flow

1. **Open browser**: `http://localhost:5173` (or your frontend URL)
2. **Navigate to login**: Click "Sign In" or go to `/login`
3. **Enter credentials**:
   - Email: `kk@gmail.com`
   - Password: [your password]
4. **Click "Sign In"**

### Expected Behavior

**After successful login:**
- Console should show: `"Login successful. User roles: ["Tutors", "Administrator", "Player"]"`
- Browser should navigate to role selector (`/`)
- Role selector shows both cards:
  - ✅ Player Portal
  - ✅ Content Creator Portal

**Click a role card:**
- Player → `/Player/dashboard`
- Content Creator → `/creator/dashboard`

### Debug Token

To view decoded token in console:
```javascript
import { debugToken } from '@/utils/jwtHelper';

const token = localStorage.getItem('authToken');
debugToken(token);
```

**Output:**
```
🔐 JWT Token Decoded
  User ID: 3f183699-c88d-4ccb-b4a6-3baeb4383512
  Email: kk@gmail.com
  Roles: ["Tutors", "Administrator", "Player"]
  Expiration: Fri Nov 28 2025 15:28:36 GMT...
  Is Expired: false
  All Claims: { sub: "...", email: "...", ... }
```

## Files Modified

### Created
- ✅ `src/utils/jwtHelper.js` - JWT utilities

### Modified
- ✅ `src/services/authApi.js` - Added JWT decoding
- ✅ `src/context/AuthContext.jsx` - Added role handling
- ✅ `src/pages/Auth/LoginPage.jsx` - Added role-based navigation
- ✅ `src/pages/LoginPage.jsx` - Added role-based navigation
- ✅ `src/pages/RoleSelector.jsx` - Added role filtering

## Environment Variables

Make sure you have the correct API URL in `.env`:

```env
VITE_AUTH_API_URL=http://localhost:7072/api
VITE_API_URL=http://localhost:7071/api
```

## Troubleshooting

### Issue: Roles not appearing
**Solution:** Check localStorage:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log(user.roles); // Should be array
```

### Issue: Auto-navigation not working
**Solution:** Check console logs:
- Look for: `"Login successful. User roles: [...]"`
- Look for: `"Available roles for user: [...]"`

### Issue: Role selector shows no cards
**Solution:** 
1. Verify token has roles: `localStorage.getItem('authToken')`
2. Decode manually: `decodeJWT(token)`
3. Check role claim: `decoded.role`

### Issue: Token expired
**Solution:**
```javascript
import { isTokenExpired } from '@/utils/jwtHelper';
const expired = isTokenExpired(localStorage.getItem('authToken'));
if (expired) {
  // Re-login required
}
```

## Security Considerations

1. **Token Storage**: Stored in `localStorage` (consider `httpOnly` cookies for production)
2. **Token Expiration**: Checked via `exp` claim
3. **Role Validation**: Both frontend (UX) and backend (security)
4. **HTTPS**: Use in production for secure token transmission

## Next Steps

1. ✅ Implement token refresh mechanism
2. ✅ Add role-based route guards
3. ✅ Implement backend role authorization
4. ✅ Add token expiration warnings
5. ✅ Implement logout functionality

## Support

For issues or questions:
- Check browser console for logs
- Verify backend is running on port 7072
- Verify frontend is running on port 5173
- Check token in localStorage is valid
