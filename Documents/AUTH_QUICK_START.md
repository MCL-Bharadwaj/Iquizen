# Authentication System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Frontend is Already Running
If your dev server is running, just refresh the browser. If not:
```bash
cd SRC/quiz-app
npm run dev
```

### 2. Access the New Pages

#### Login Page
```
http://localhost:5173/login
```

#### Register Page
```
http://localhost:5173/register
```

#### Forgot Password
```
http://localhost:5173/forgot-password
```

---

## 🧪 Test the Complete Flow

### Registration Flow (3-Step Process)

**Step 1: Account Info**
1. Navigate to: `http://localhost:5173/register`
2. Enter:
   - Email: `test@example.com`
   - Password: `Test@1234` (see strength meter)
   - Confirm Password: `Test@1234`
3. Click "Continue"

**Step 2: Personal Info**
4. Enter:
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `+1 555 123 4567`
   - Gender: Click "Male" (or your choice)
5. Click "Continue"

**Step 3: Address & DOB**
6. Enter:
   - Date of Birth: `01/15/1990`
   - Address 1: `123 Main St`
   - City: `New York`
   - State: `NY`
   - Country: `USA`
   - Postal Code: `10001`
7. Click "Create Account"

**Success!**
8. You'll see success screen
9. Email verification notice displayed
10. Click "Go to Login"

---

### Login Flow

1. Navigate to: `http://localhost:5173/login`
2. Enter your registered credentials:
   - Email: `test@example.com`
   - Password: `Test@1234`
3. (Optional) Check "Remember me"
4. Click "Sign In"

**On Success:**
- Token saved to localStorage
- User data saved to localStorage
- Redirected to role selector (`/`)

**Protected Routes:**
- All Player routes require authentication
- All Creator routes require authentication
- Trying to access without login → Redirect to `/login`

---

### Forgot Password Flow

1. Navigate to: `http://localhost:5173/forgot-password`
2. Enter email: `test@example.com`
3. Click "Send Reset Link"
4. Success screen appears
5. In production, user receives email with reset link
6. Link format: `http://localhost:5173/reset-password?token=abc123`

---

### Reset Password Flow

1. User clicks link from email (in production)
2. Redirected to: `http://localhost:5173/reset-password?token=abc123`
3. Enter:
   - New Password: `NewTest@1234`
   - Confirm Password: `NewTest@1234`
4. Click "Reset Password"
5. Success → Auto-redirect to login after 3 seconds

---

### Email Verification Flow

1. User registers
2. Receives verification email (in production)
3. Clicks link: `http://localhost:5173/verify-email?token=xyz789`
4. Page automatically verifies token
5. Shows success/error message
6. Redirects to login

---

## 🎨 UI Features to Test

### Password Strength Meter
- Type in password field during registration
- Watch strength bar change color:
  - Red = Weak
  - Orange = Fair
  - Yellow = Good
  - Green = Strong
  - Dark Green = Very Strong
- See requirements checklist turn green as met

### Dark Mode Toggle
- Click sun/moon icon in top-right
- All pages support dark/light theme
- Theme persists in localStorage

### Form Validation
- Try submitting without required fields
- See red error messages
- Errors clear when you start typing
- Password mismatch detection
- Email format validation

### Loading States
- See spinner while API calls in progress
- Button disabled during loading
- Text changes (e.g., "Signing in...")

### Responsive Design
- Resize browser window
- Mobile: Single column, full width
- Desktop: Side branding panel appears (1280px+)

---

## 🔍 Developer Tools Checklist

### Check localStorage
Open browser DevTools → Application → Local Storage → `http://localhost:5173`

After login, you should see:
```
authToken: "eyJhbG..."  // JWT token
user: "{\"userId\":...}"  // User object JSON
darkMode: "false"  // or "true"
rememberMe: "true"  // if checked
```

### Network Tab
Check API calls:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/verify-email`

### Console
No errors should appear in console.
Auth-related logs will show success/error messages.

---

## 🐛 Troubleshooting

### "Invalid or missing reset token"
- Reset password link must include `?token=...` parameter
- Token may be expired (24 hours in production)
- Solution: Request new password reset

### Can't login after registration
- Email may need verification first (check backend settings)
- Check if backend returned success
- Verify credentials are correct

### Redirected to login when accessing protected routes
- This is correct behavior!
- Login first, then access protected routes
- Check if token exists in localStorage

### API errors (CORS, Network, etc.)
- Ensure backend API is running (if local)
- Check `BASE_URL` in `src/services/authApi.js`
- Current: `https://mcl-lms-dev.azurewebsites.net/api`
- Verify internet connection

---

## 📝 Code Organization

```
SRC/quiz-app/src/
├── services/
│   └── authApi.js          ← All API calls
├── context/
│   └── AuthContext.jsx     ← Global auth state
├── components/
│   ├── Auth/
│   │   ├── AuthLayout.jsx  ← Consistent layout
│   │   ├── FormInput.jsx   ← Reusable input
│   │   └── PasswordInput.jsx ← Password with meter
│   └── ProtectedRoute.jsx  ← Route protection
├── pages/
│   └── Auth/
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx       (3-step form)
│       ├── ForgotPasswordPage.jsx
│       ├── ResetPasswordPage.jsx
│       └── VerifyEmailPage.jsx
└── App.jsx                 ← Routes with AuthProvider
```

---

## 🎯 Key Concepts

### AuthContext
- Wraps entire app
- Provides `useAuth()` hook
- Methods: `login()`, `register()`, `logout()`, etc.
- State: `user`, `token`, `isAuthenticated`, `loading`

### Protected Routes
- Checks `isAuthenticated` from context
- Shows loading spinner while checking
- Redirects to `/login` if not authenticated
- Wraps role-specific routes

### Token Flow
1. User logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. All API calls include token in Authorization header
5. On 401 error → Auto-logout → Redirect to login

---

## ⚡ Next Actions

1. **Test registration** with the LMS API
2. **Test login** and verify token is returned
3. **Check email verification** workflow
4. **Test password reset** functionality
5. **Verify protected routes** work correctly

---

## 📞 Need Help?

Check these files for details:
- **Full Proposal**: `Documents/AUTH_STRIPE_PROPOSAL.md`
- **Implementation Details**: `Documents/AUTH_IMPLEMENTATION_PHASE1_COMPLETE.md`
- **This Guide**: `Documents/AUTH_QUICK_START.md`

---

**Ready to test! 🚀**

Start with the registration page and work through the complete flow.
