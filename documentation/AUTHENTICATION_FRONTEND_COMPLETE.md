# Authentication Frontend - Complete ✅

## Files Created

### 1. **Authentication Service** (`src/services/auth.js`)
- JWT token management (store/retrieve)
- Login endpoint integration
- Signup endpoint integration (admin-only)
- Get current user profile
- Auto-expiration checking
- Logout functionality
- Auth headers for API calls

### 2. **Login Page** (`src/pages/LoginPage.jsx`)
- Clean, modern UI with dark/light theme support
- Username and password fields
- Error handling and validation
- Auto-redirect based on user role:
  - Student → `/student/dashboard`
  - Tutor → `/tutor/dashboard`
  - Admin → `/tutor/dashboard`

### 3. **Signup Page** (`src/pages/SignupPage.jsx`)
- **Hidden route**: `/create` (not linked anywhere)
- Requires admin JWT token for access
- Form fields:
  - Username, Full Name, Email
  - Password, Confirm Password
  - Role selection (Student, Tutor, Admin)
  - Level enrollment (for Students only)
- Multi-level selection with checkboxes
- Success/error notifications
- Auto-redirect to login after successful signup

### 4. **Protected Route Component** (`src/components/ProtectedRoute.jsx`)
- Checks JWT token validity
- Redirects unauthenticated users to login
- Role-based access control
- Auto-redirect based on actual user role

### 5. **Updated App.jsx**
- Added authentication routes
- Protected all student/tutor/creator routes
- Default route redirects to `/login`
- Fallback routes redirect to `/login`

### 6. **Updated Sidebar**
- Added logout functionality
- Clears localStorage on logout
- Redirects to login page
- Red-colored logout button

---

## Routes Structure

### Public Routes
- `/login` - Login page (public)
- `/create` - Signup page (hidden, requires admin token)

### Protected Routes
- `/student/*` - Student dashboard and pages (requires Student role)
- `/tutor/*` - Tutor dashboard and pages (requires Tutor/Admin role)
- `/creator/*` - Content creator pages

---

## How to Use

### For Students/Tutors (Login)
1. Navigate to `http://localhost:5173/login`
2. Enter username and password
3. Click "Sign In"
4. Auto-redirected to appropriate dashboard

### For Admins (Create New User)
1. Login as admin first to get JWT token
2. Navigate to `http://localhost:5173/create`
3. Enter your admin JWT token at the top
4. Fill in user details
5. Select role and levels (if student)
6. Click "Create Account"

---

## API Integration

### Login Flow
```javascript
POST /api/auth/login
Body: { username, password }
Response: { token, userId, username, role, enrolledLevels }
```

### Signup Flow (Admin Only)
```javascript
POST /api/auth/signup
Headers: { Authorization: "Bearer <admin_token>" }
Body: { username, password, email, fullName, role, levelIds }
Response: { userId, username, role }
```

### Get Current User
```javascript
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { userId, username, email, fullName, role, isActive, enrolledLevels }
```

---

## Security Features

✅ **JWT Token Storage** - Stored in localStorage
✅ **Auto-expiration Check** - Token validity checked before every protected route
✅ **Role-based Access** - Users redirected based on their role
✅ **Hidden Signup** - No visible link to signup page
✅ **Admin-only Registration** - Requires valid admin JWT token
✅ **Password Confirmation** - Ensures passwords match before submission
✅ **Error Handling** - Clear error messages for failed authentication

---

## Next Steps

1. **Run Database Migration**
   ```bash
   cd DatabaseScripts
   psql -U postgres -d quiz_db -f 011_users_and_auth.sql
   ```

2. **Create First Admin User**
   ```bash
   # Generate BCrypt hash for password "admin123"
   # Hash: $2a$11$your_bcrypt_hash_here
   
   psql -U postgres -d quiz_db
   
   INSERT INTO quiz.users (user_id, username, password_hash, email, full_name, role, is_active)
   VALUES (
     gen_random_uuid(),
     'admin',
     '$2a$11$your_bcrypt_hash_here',
     'admin@example.com',
     'System Administrator',
     'Admin',
     true
   );
   ```

3. **Configure JWT in Azure Functions**
   Add to `Functions/local.settings.json`:
   ```json
   {
     "Values": {
       "JWT:Secret": "your-super-secret-key-at-least-32-characters-long",
       "JWT:Issuer": "QuizzApp",
       "JWT:Audience": "QuizzApp",
       "JWT:ExpirationMinutes": "60"
     }
   }
   ```

4. **Start Backend**
   ```bash
   cd Functions
   func start
   ```

5. **Start Frontend**
   ```bash
   cd quiz-app
   npm run dev
   ```

6. **Test Login**
   - Navigate to `http://localhost:5173/login`
   - Login with admin credentials
   - You should be redirected to tutor dashboard

7. **Create Additional Users**
   - Navigate to `http://localhost:5173/create`
   - Use admin JWT token to create students/tutors

---

## Troubleshooting

### "Invalid username or password"
- Check that admin user exists in database
- Verify BCrypt hash is correct
- Check Azure Functions is running on port 7071

### "Failed to create account"
- Verify admin JWT token is valid and not expired
- Check that level IDs match database (level0-level4)
- Ensure Azure Functions `/api/auth/signup` endpoint is accessible

### Token Expiration
- Tokens expire after 60 minutes (configurable)
- User will be auto-redirected to login page
- Re-login to get new token

### Cannot Access Signup Page
- Signup page is intentionally hidden
- Must manually navigate to `http://localhost:5173/create`
- Requires admin JWT token

---

## Demo Workflow

1. **Admin creates first student**:
   - Admin logs in → Gets JWT token
   - Admin navigates to `/create`
   - Enters admin token, creates student "john_doe"
   - Enrolls john_doe in "level0" and "level1"

2. **Student logs in**:
   - Student navigates to `/login`
   - Enters username "john_doe" and password
   - Auto-redirected to student dashboard
   - Sees quizzes for level0 and level1 only

3. **Tutor manages students**:
   - Tutor logs in
   - Sees assigned levels
   - Views student responses for grading
   - Provides feedback

---

## File Structure
```
quiz-app/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx  ✅ NEW
│   │   └── Sidebar.jsx          ✅ UPDATED (logout)
│   ├── pages/
│   │   ├── LoginPage.jsx        ✅ NEW
│   │   ├── SignupPage.jsx       ✅ NEW
│   │   └── ...
│   ├── services/
│   │   ├── auth.js              ✅ NEW
│   │   └── api.js               (existing)
│   ├── App.jsx                  ✅ UPDATED (routes)
│   └── ...
```

---

## Success! 🎉

Your authentication system is now complete with:
- ✅ Beautiful login page
- ✅ Hidden admin signup page
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Auto-redirect based on role
- ✅ Logout functionality
- ✅ Dark/light theme support

**Ready to test once backend is configured!**
