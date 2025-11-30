# ✅ Implementation Checklist

Use this checklist to track your authentication system implementation progress.

---

## 📋 Phase 1: Database Setup

- [ ] **PostgreSQL is running**
  - [ ] Service is active
  - [ ] Can connect via `psql`
  - [ ] Database `quiz_db` exists

- [ ] **Run Migration Script**
  ```bash
  psql -U postgres -d quiz_db -f DatabaseScripts/011_users_and_auth.sql
  ```
  - [ ] Script executed without errors
  - [ ] Check: `SELECT COUNT(*) FROM quiz.levels;` returns 5
  - [ ] Check: `\dt quiz.*` shows new tables (users, levels, user_levels, tutor_level_assignments)

- [ ] **Create Admin User**
  - [ ] Generated BCrypt hash for admin password
  - [ ] Inserted admin user into `quiz.users` table
  - [ ] Verified: `SELECT * FROM quiz.users WHERE role='admin';`

- [ ] **Verify Database Structure**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'quiz' 
  ORDER BY table_name;
  ```
  - [ ] Table `users` exists
  - [ ] Table `levels` exists (with 5 rows)
  - [ ] Table `user_levels` exists
  - [ ] Table `tutor_level_assignments` exists
  - [ ] Table `quizzes` has `level_id` column

---

## 📋 Phase 2: Backend Configuration

- [ ] **Configure Connection String**
  - [ ] Updated `Functions/local.settings.json`
  - [ ] Db__ConnectionString is correct
  - [ ] Can connect to database

- [ ] **Configure JWT Settings**
  - [ ] `JWT:Secret` - at least 32 characters
  - [ ] `JWT:Issuer` - set to "QuizApp"
  - [ ] `JWT:Audience` - set to "QuizAppUsers"
  - [ ] `JWT:ExpirationMinutes` - set to 60

- [ ] **Install Dependencies**
  ```bash
  dotnet restore
  ```
  - [ ] All packages restored successfully
  - [ ] No version conflicts
  - [ ] System.IdentityModel.Tokens.Jwt installed

- [ ] **Build Solution**
  ```bash
  dotnet build
  ```
  - [ ] Build succeeded
  - [ ] No compilation errors
  - [ ] All projects compiled successfully

---

## 📋 Phase 3: Backend Testing

- [ ] **Start Azure Functions**
  ```bash
  cd Functions
  func start
  ```
  - [ ] Functions started without errors
  - [ ] Endpoints are listed
  - [ ] Listening on http://localhost:7071

- [ ] **Test Login Endpoint**
  ```bash
  curl -X POST http://localhost:7071/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```
  - [ ] Returns 200 OK
  - [ ] Returns JWT token
  - [ ] Returns user info (userId, username, role)
  - [ ] Token is valid JWT format
  - [ ] Save token for next tests

- [ ] **Test Create User (Signup)**
  ```bash
  curl -X POST http://localhost:7071/api/auth/signup \
    -H "Authorization: Bearer <admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"username":"teststudent","password":"test123","role":"student","levelCodes":["level1"]}'
  ```
  - [ ] Returns 201 Created
  - [ ] User created in database
  - [ ] Student enrolled in level1
  - [ ] Can login with new credentials

- [ ] **Test Student Login**
  ```bash
  curl -X POST http://localhost:7071/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"teststudent","password":"test123"}'
  ```
  - [ ] Returns 200 OK
  - [ ] Returns student token
  - [ ] enrolledLevels array contains level1

- [ ] **Test Student Levels Endpoint**
  ```bash
  curl -X GET http://localhost:7071/api/student/levels \
    -H "Authorization: Bearer <student-token>"
  ```
  - [ ] Returns 200 OK
  - [ ] Returns array of enrolled levels
  - [ ] Shows level1 data

- [ ] **Test Student Quizzes Endpoint**
  ```bash
  curl -X GET http://localhost:7071/api/student/quizzes \
    -H "Authorization: Bearer <student-token>"
  ```
  - [ ] Returns 200 OK
  - [ ] Returns quizzes for level1 (if any exist)
  - [ ] Or returns empty array

- [ ] **Test Authorization**
  - [ ] Student token cannot access `/api/auth/signup`
  - [ ] Invalid token returns 401 Unauthorized
  - [ ] Expired token returns 401 Unauthorized

---

## 📋 Phase 4: Data Setup

- [ ] **Assign Quizzes to Levels**
  ```sql
  UPDATE quiz.quizzes 
  SET level_id = (SELECT level_id FROM quiz.levels WHERE level_code = 'level1')
  WHERE age_min >= 7 AND age_max <= 9;
  ```
  - [ ] Existing quizzes assigned to appropriate levels
  - [ ] Verified: `SELECT COUNT(*) FROM quiz.quizzes WHERE level_id IS NOT NULL;`

- [ ] **Create Test Users**
  - [ ] Created 2-3 student accounts
  - [ ] Created 1 tutor account
  - [ ] All can login successfully

- [ ] **Enroll Students in Levels**
  ```sql
  INSERT INTO quiz.user_levels (user_id, level_id)
  SELECT u.user_id, l.level_id
  FROM quiz.users u, quiz.levels l
  WHERE u.username = 'student1' AND l.level_code = 'level1';
  ```
  - [ ] Students enrolled in appropriate levels
  - [ ] Can query enrollment: `SELECT * FROM quiz.user_levels;`

- [ ] **Assign Tutor to Level**
  ```sql
  INSERT INTO quiz.tutor_level_assignments (tutor_id, level_id)
  SELECT u.user_id, l.level_id
  FROM quiz.users u, quiz.levels l
  WHERE u.username = 'tutor1' AND l.level_code = 'level1';
  ```
  - [ ] Tutor assigned to level(s)
  - [ ] Verified: `SELECT * FROM quiz.tutor_level_assignments;`

- [ ] **Test Tutor Endpoints**
  - [ ] Tutor can login
  - [ ] GET `/api/tutor/levels` returns assigned levels
  - [ ] GET `/api/tutor/students?levelId=X` returns students

---

## 📋 Phase 5: Frontend Setup

- [ ] **Create Login Page**
  - [ ] Component created: `src/components/auth/LoginPage.tsx`
  - [ ] Form with username/password fields
  - [ ] Calls `/api/auth/login` endpoint
  - [ ] Stores JWT token in localStorage
  - [ ] Redirects based on role

- [ ] **Create Signup Page (Hidden)**
  - [ ] Component created: `src/components/auth/SignupPage.tsx`
  - [ ] Route: `/create`
  - [ ] Only accessible by admin
  - [ ] Form for creating new users
  - [ ] Level selection checkboxes

- [ ] **Create Student Dashboard**
  - [ ] Component created: `src/components/student/Dashboard.tsx`
  - [ ] Shows enrolled levels
  - [ ] Shows available quizzes
  - [ ] Can navigate to take quiz

- [ ] **Create Tutor Dashboard**
  - [ ] Component created: `src/components/tutor/Dashboard.tsx`
  - [ ] Shows assigned levels
  - [ ] Shows student list
  - [ ] Shows pending responses to grade

- [ ] **Implement Protected Routes**
  - [ ] Created `ProtectedRoute` wrapper component
  - [ ] Validates JWT token
  - [ ] Checks user role
  - [ ] Redirects to login if unauthorized

- [ ] **Add Authorization to API Calls**
  - [ ] All API calls include `Authorization: Bearer <token>` header
  - [ ] Token retrieved from localStorage
  - [ ] Handle 401 responses (redirect to login)

---

## 📋 Phase 6: Testing & Validation

- [ ] **End-to-End Testing**
  - [ ] Admin can create users
  - [ ] Students can login and see their levels
  - [ ] Students can view and take quizzes
  - [ ] Tutors can login and see assigned levels
  - [ ] Tutors can view student responses
  - [ ] Role-based access is enforced

- [ ] **Security Testing**
  - [ ] Cannot access endpoints without token
  - [ ] Student cannot access tutor endpoints
  - [ ] Student cannot access admin endpoints
  - [ ] Tutor cannot access other levels
  - [ ] Token expiration works correctly

- [ ] **Database Testing**
  - [ ] Run helper queries from `Auth_Helper_Queries.sql`
  - [ ] Verify data integrity
  - [ ] Check foreign key constraints
  - [ ] Verify RLS policies work

---

## 📋 Phase 7: Documentation Review

- [ ] **Read Documentation**
  - [ ] Read `QUICK_START.md`
  - [ ] Read `AUTH_IMPLEMENTATION.md`
  - [ ] Review `ARCHITECTURE_DIAGRAM.md`
  - [ ] Reference `Auth_Helper_Queries.sql`

- [ ] **Update Project Docs**
  - [ ] Add auth system to main README
  - [ ] Document API endpoints
  - [ ] Add setup instructions
  - [ ] Include troubleshooting guide

---

## 📋 Phase 8: Production Preparation

- [ ] **Security Hardening**
  - [ ] Change default admin password
  - [ ] Use strong JWT secret (64+ characters)
  - [ ] Enable HTTPS only
  - [ ] Configure CORS properly
  - [ ] Add rate limiting
  - [ ] Enable audit logging

- [ ] **Password Policies**
  - [ ] Increase minimum password length to 8
  - [ ] Add password complexity requirements
  - [ ] Implement password reset functionality
  - [ ] Add account lockout after failed attempts

- [ ] **Environment Configuration**
  - [ ] Separate dev/staging/prod configs
  - [ ] Use Azure Key Vault for secrets
  - [ ] Configure connection string securely
  - [ ] Set appropriate JWT expiration

- [ ] **Monitoring & Logging**
  - [ ] Enable Application Insights
  - [ ] Log authentication attempts
  - [ ] Log authorization failures
  - [ ] Set up alerts for security events

---

## 📋 Phase 9: Additional Features (Optional)

- [ ] **Password Reset**
  - [ ] Create reset token table
  - [ ] Email reset link endpoint
  - [ ] Reset password endpoint
  - [ ] Reset password UI

- [ ] **Email Verification**
  - [ ] Create verification token table
  - [ ] Send verification email
  - [ ] Verification endpoint
  - [ ] Resend verification email

- [ ] **Profile Management**
  - [ ] Update profile endpoint
  - [ ] Change password endpoint
  - [ ] Upload avatar endpoint
  - [ ] Profile edit UI

- [ ] **Admin Panel**
  - [ ] User management UI
  - [ ] Level management UI
  - [ ] Tutor assignment UI
  - [ ] System settings UI

- [ ] **Progress Tracking**
  - [ ] Update progress_percentage logic
  - [ ] Visual progress bars
  - [ ] Achievement badges
  - [ ] Completion certificates

---

## 📋 Completion Status

### Overall Progress: _____ %

- Database: ☐ Not Started | ☐ In Progress | ☐ Complete
- Backend: ☐ Not Started | ☐ In Progress | ☐ Complete
- Frontend: ☐ Not Started | ☐ In Progress | ☐ Complete
- Testing: ☐ Not Started | ☐ In Progress | ☐ Complete
- Production: ☐ Not Started | ☐ In Progress | ☐ Complete

---

## 📝 Notes

Add any notes, issues, or observations here:

```
Date: _____________
Notes:




```

---

## ✅ Sign-Off

- [ ] **All core features implemented**
- [ ] **All tests passing**
- [ ] **Documentation complete**
- [ ] **Security verified**
- [ ] **Ready for production**

Completed by: ________________  
Date: ________________

---

**Great job! Your authentication system is ready! 🎉**
