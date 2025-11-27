# 🚀 Quick Start Guide - Authentication System

## ⚡ Get Up and Running in 5 Minutes

### Step 1: Run Database Migration
```powershell
cd c:\Users\USER\Desktop\Quizz\DatabaseScripts
psql -U postgres -d quiz_db -f 011_users_and_auth.sql
```

### Step 2: Create First Admin User
```sql
-- Connect to database
psql -U postgres -d quiz_db

-- Insert admin (username: admin, password: admin123)
INSERT INTO quiz.users (username, password_hash, email, full_name, role)
VALUES (
    'admin',
    '$2a$11$vqmLqGv.v1qF9Z1F1GZp9uKPZL2V9Y2Y2Y2Y2Y2Y2Y2Y2Y2Y2Y2Y2',
    'admin@quizapp.com',
    'Administrator',
    'admin'
);
```

**⚠️ IMPORTANT**: Generate a proper BCrypt hash for production! Use:
```csharp
BCrypt.Net.BCrypt.HashPassword("your-secure-password")
```

### Step 3: Add JWT Configuration
Update `Functions/local.settings.json`:

```json
{
  "Values": {
    "PostgresConnectionString": "Host=localhost;Database=quiz_db;Username=postgres;Password=yourpassword",
    "JWT:Secret": "your-secret-key-at-least-32-characters-long-for-security",
    "JWT:Issuer": "QuizApp",
    "JWT:Audience": "QuizAppUsers",
    "JWT:ExpirationMinutes": "60"
  }
}
```

### Step 4: Restore Packages and Build
```powershell
cd c:\Users\USER\Desktop\Quizz
dotnet restore
dotnet build
```

### Step 5: Run Azure Functions
```powershell
cd Functions
func start
```

---

## 📝 Test the System

### 1. Login as Admin
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Save the token from the response!**

### 2. Create a Student
```bash
curl -X POST http://localhost:7071/api/auth/signup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\":\"student1\",
    \"password\":\"test123\",
    \"fullName\":\"Test Student\",
    \"email\":\"student1@test.com\",
    \"role\":\"student\",
    \"levelCodes\":[\"level1\",\"level2\"]
  }"
```

### 3. Login as Student
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"student1\",\"password\":\"test123\"}"
```

### 4. Get Student's Levels
```bash
curl -X GET http://localhost:7071/api/student/levels \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### 5. Get Student's Quizzes
```bash
curl -X GET http://localhost:7071/api/student/quizzes \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

---

## 🎯 What You Get

### ✅ Database Tables Created
- `users` - User accounts with roles
- `levels` - Education levels (level0-level4) **[SEEDED]**
- `user_levels` - Student enrollments
- `tutor_level_assignments` - Tutor assignments
- `quizzes.level_id` - Level association for quizzes

### ✅ API Endpoints Ready
- `POST /api/auth/login` - Public login
- `POST /api/auth/signup` - Admin-only signup
- `GET /api/auth/me` - Get current user
- `GET /api/student/levels` - Student's enrolled levels
- `GET /api/student/quizzes` - Student's available quizzes
- `GET /api/tutor/levels` - Tutor's assigned levels
- `GET /api/tutor/responses` - Student responses for grading
- `GET /api/tutor/students` - Students in tutor's levels

### ✅ Security Features
- BCrypt password hashing
- JWT token authentication
- Role-based access control (Student, Tutor, Admin)
- Row-level security policies
- Token expiration

---

## 🎨 Frontend Routes to Build

### Public
- `/login` - Login page (visible to all)

### Hidden Admin Only
- `/create` - Signup page (secret route)

### Student Routes
- `/student/dashboard` - View enrolled levels
- `/student/levels/:levelId` - View quizzes for level
- `/student/quiz/:quizId` - Take quiz
- `/student/results` - View past results

### Tutor Routes
- `/tutor/dashboard` - View assigned levels
- `/tutor/level/:levelId` - View level details
- `/tutor/students/:levelId` - View students in level
- `/tutor/responses/:levelId` - Grade student responses
- `/tutor/quiz/create` - Create new quiz for level

---

## 🔧 Next Development Steps

### 1. Link Existing Quizzes to Levels
```sql
-- Update existing quizzes to assign them to levels
UPDATE quiz.quizzes 
SET level_id = (SELECT level_id FROM quiz.levels WHERE level_code = 'level1')
WHERE age_min >= 5 AND age_min <= 7;
```

### 2. Create Tutor and Assign to Level
```sql
-- Create a tutor user
INSERT INTO quiz.users (username, password_hash, full_name, role)
VALUES ('tutor1', '$2a$11$...', 'Ms. Smith', 'tutor');

-- Assign tutor to level1
INSERT INTO quiz.tutor_level_assignments (tutor_id, level_id)
SELECT 
    u.user_id,
    l.level_id
FROM quiz.users u, quiz.levels l
WHERE u.username = 'tutor1' AND l.level_code = 'level1';
```

### 3. Build React Components
See `AUTH_IMPLEMENTATION.md` for detailed component examples.

### 4. Add Password Reset
- Create reset token table
- Email reset link
- Reset password endpoint

### 5. Add User Profile Management
- Update profile endpoint
- Change password endpoint
- Upload avatar

---

## 🐛 Troubleshooting

### "JWT:Secret not configured"
➡️ Add JWT settings to `local.settings.json`

### "Connection refused to localhost:5432"
➡️ Ensure PostgreSQL is running: `sudo service postgresql start`

### "Schema 'quiz' does not exist"
➡️ Run all migration scripts in order (000-011)

### "Invalid username or password"
➡️ Verify BCrypt hash is correct, or use test credentials

### "Authentication required"
➡️ Include `Authorization: Bearer <token>` header in requests

---

## 📚 Documentation

- **Complete Guide**: `AUTH_IMPLEMENTATION.md`
- **Database Schema**: `DatabaseScripts/011_users_and_auth.sql`
- **API Models**: `DataModel/ApiModels/Auth.cs`
- **Endpoints**: `Functions/Endpoints/Auth*.cs`

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Admin user created
- [ ] JWT configuration added
- [ ] Application builds successfully
- [ ] Azure Functions running
- [ ] Login endpoint working
- [ ] Signup endpoint working
- [ ] Student endpoints returning data
- [ ] Frontend can authenticate
- [ ] Tokens being validated

---

## 🎉 You're Ready!

Start building your React frontend with these authenticated endpoints!

**Next**: Create the LoginPage component and test the full authentication flow.
