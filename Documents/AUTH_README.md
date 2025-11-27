# 🔐 Authentication & Level System - README

## 📖 Overview

This is a **complete authentication and level-based access control system** for a Quiz Application built with:
- **PostgreSQL** database
- **Azure Functions** (.NET 8) backend API
- **React** frontend (to be implemented)
- **JWT** token authentication
- **BCrypt** password hashing
- **Role-based access control** (Student, Tutor, Admin)

---

## 🎯 Key Features

### ✅ Authentication
- Secure login with JWT tokens
- Password hashing with BCrypt
- Admin-only user creation via hidden route
- Token-based API authorization
- Role-based access control

### ✅ Level System
- 5 pre-defined levels (level0 to level4)
- Students can enroll in multiple levels
- Tutors assigned to specific levels
- Quizzes organized by level
- Progress tracking per level

### ✅ User Roles
- **Student**: View enrolled levels, take quizzes, see results
- **Tutor**: Manage assigned levels, grade responses, view students
- **Admin**: Full system access, create users, assign levels

---

## 📚 Documentation

| Document | Purpose | Lines |
|----------|---------|-------|
| **QUICK_START.md** | Get running in 5 minutes | ~200 |
| **AUTH_IMPLEMENTATION.md** | Complete guide with examples | ~500 |
| **IMPLEMENTATION_SUMMARY.md** | What was built | ~400 |
| **ARCHITECTURE_DIAGRAM.md** | Visual architecture | ~300 |
| **Auth_Helper_Queries.sql** | SQL query examples | ~400 |

### 🚀 Start Here
1. Read `QUICK_START.md` to set up in 5 minutes
2. Reference `AUTH_IMPLEMENTATION.md` for detailed docs
3. Use `Auth_Helper_Queries.sql` for SQL examples

---

## 🗂️ Project Structure

```
Quizz/
├── DatabaseScripts/
│   ├── 011_users_and_auth.sql          # Main migration script
│   └── Auth_Helper_Queries.sql         # SQL examples
│
├── DataModel/
│   ├── DbModelDocuments/
│   │   ├── UserDb.cs                   # User entity
│   │   ├── LevelDb.cs                  # Level entity
│   │   ├── UserLevelDb.cs              # Enrollment entity
│   │   └── TutorLevelAssignmentDb.cs   # Assignment entity
│   └── ApiModels/
│       └── Auth.cs                      # Request/Response models
│
├── Auth/
│   └── Services/
│       └── AuthService.cs               # JWT + BCrypt service
│
├── Functions/
│   ├── Endpoints/
│   │   ├── AuthEndpoints.cs            # Login, Signup, Profile
│   │   ├── StudentEndpoints.cs         # Student dashboard APIs
│   │   └── TutorEndpoints.cs           # Tutor dashboard APIs
│   └── Program.cs                       # DI configuration
│
└── Documentation/
    ├── QUICK_START.md
    ├── AUTH_IMPLEMENTATION.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── ARCHITECTURE_DIAGRAM.md
    └── AUTH_README.md (this file)
```

---

## ⚡ Quick Start

### 1️⃣ Database Setup
```bash
cd DatabaseScripts
psql -U postgres -d quiz_db -f 011_users_and_auth.sql
```

### 2️⃣ Create Admin User
```sql
INSERT INTO quiz.users (username, password_hash, email, full_name, role)
VALUES ('admin', '$2a$11$BCryptHashHere', 'admin@quiz.com', 'Admin', 'admin');
```

### 3️⃣ Configure Settings
Add to `Functions/local.settings.json`:
```json
{
  "Values": {
    "PostgresConnectionString": "Host=localhost;Database=quiz_db;Username=postgres;Password=yourpassword",
    "JWT:Secret": "your-32-character-secret-key-here",
    "JWT:Issuer": "QuizApp",
    "JWT:Audience": "QuizAppUsers",
    "JWT:ExpirationMinutes": "60"
  }
}
```

### 4️⃣ Build & Run
```bash
dotnet restore
dotnet build
cd Functions
func start
```

### 5️⃣ Test
```bash
# Login
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | None | All | User login |
| POST | `/api/auth/signup` | Admin Token | Admin | Create users |
| GET | `/api/auth/me` | Token | All | Current user profile |
| GET | `/api/student/levels` | Token | Student | Enrolled levels |
| GET | `/api/student/quizzes` | Token | Student | Available quizzes |
| GET | `/api/tutor/levels` | Token | Tutor | Assigned levels |
| GET | `/api/tutor/responses` | Token | Tutor | Student responses |
| GET | `/api/tutor/students` | Token | Tutor | Level students |

---

## 🗄️ Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts | username, password_hash, role |
| `levels` | Education levels | level_code, level_name, display_order |
| `user_levels` | Student enrollment | user_id, level_id, progress_percentage |
| `tutor_level_assignments` | Tutor assignments | tutor_id, level_id, is_active |
| `quizzes` | Quiz metadata | quiz_id, level_id, title, difficulty |

---

## 🔒 Security Features

✅ **Password Security**
- BCrypt hashing (work factor 11)
- Automatic salting
- Never stored in plain text

✅ **Token Security**
- JWT with HS256 signing
- 60-minute expiration
- Claims: user_id, username, role

✅ **Access Control**
- Role-based authorization
- Endpoint-level validation
- Row-level security (RLS)

✅ **SQL Security**
- Parameterized queries only
- No string concatenation
- Npgsql protection

---

## 👥 User Workflows

### Student Journey
```
1. Login → Receive JWT token
2. View enrolled levels
3. Browse quizzes for each level
4. Take quiz → Submit responses
5. View results and feedback
```

### Tutor Journey
```
1. Login → Receive JWT token
2. View assigned levels
3. See students in each level
4. Review student responses
5. Grade and provide feedback
6. Create new quizzes
```

### Admin Journey
```
1. Login → Receive JWT token
2. Navigate to /create (hidden route)
3. Create new users (students/tutors)
4. Assign students to levels
5. Assign tutors to levels
6. Manage system
```

---

## 🎓 Level System

| Level Code | Level Name | Target Age | Description |
|------------|------------|------------|-------------|
| level0 | Foundation | 3-6 | Basic concepts and simple quizzes |
| level1 | Beginner | 7-9 | Introduction to core subjects |
| level2 | Intermediate | 10-12 | Building on fundamental knowledge |
| level3 | Advanced | 13-15 | Complex topics and applications |
| level4 | Expert | 16-18 | Mastery level challenges |

---

## 🛠️ Technology Stack

### Backend
- **.NET 8** - Runtime
- **Azure Functions** - Serverless API
- **Npgsql** - PostgreSQL driver
- **BCrypt.Net** - Password hashing
- **System.IdentityModel.Tokens.Jwt** - JWT handling

### Database
- **PostgreSQL 13+** - Database
- **JSONB** - Flexible content storage
- **Row Level Security** - Data isolation
- **Indexes** - Performance optimization

### Frontend (To Be Built)
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

---

## 📊 Key Design Decisions

### ✅ Why Separate Levels Table?
- **Flexibility**: Easy to add/modify levels
- **Scalability**: No data duplication
- **Extensibility**: Add metadata per level
- **Performance**: Efficient queries

### ✅ Why Many-to-Many User-Levels?
- Students can enroll in multiple levels
- Track completion per level
- Measure progress individually
- Support flexible enrollment

### ✅ Why JWT Tokens?
- **Stateless**: No server-side sessions
- **Scalable**: Works across multiple servers
- **Standard**: Industry best practice
- **Secure**: Signed and validated

### ✅ Why Hidden Signup Route?
- **Security**: Prevents unauthorized signups
- **Control**: Admin manages all users
- **Simplicity**: No email verification needed
- **Flexibility**: Can add public signup later

---

## 🧪 Testing

### Manual Testing
```bash
# Test login
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"test123"}'

# Test student levels (requires token from login)
curl -X GET http://localhost:7071/api/student/levels \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Database Verification
```sql
-- Check users
SELECT username, role, is_active FROM quiz.users;

-- Check levels
SELECT level_code, level_name FROM quiz.levels ORDER BY display_order;

-- Check enrollments
SELECT u.username, l.level_code 
FROM quiz.users u
JOIN quiz.user_levels ul ON u.user_id = ul.user_id
JOIN quiz.levels l ON ul.level_id = l.level_id;
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "JWT:Secret not configured" | Add JWT settings to `local.settings.json` |
| "Connection refused" | Ensure PostgreSQL is running |
| "Schema 'quiz' does not exist" | Run all migrations in order |
| "Invalid username or password" | Verify BCrypt hash is correct |
| "Authentication required" | Include `Authorization: Bearer <token>` header |

---

## 📈 Next Steps

### Immediate Tasks
- [ ] Run database migration
- [ ] Create admin user
- [ ] Configure JWT settings
- [ ] Build and test backend
- [ ] Test all endpoints

### Frontend Development
- [ ] Create LoginPage component
- [ ] Create SignupPage (hidden)
- [ ] Build StudentDashboard
- [ ] Build TutorDashboard
- [ ] Implement protected routes

### Additional Features
- [ ] Password reset
- [ ] Email verification
- [ ] User profile editing
- [ ] Progress visualization
- [ ] Admin panel
- [ ] Tutor quiz creation UI

---

## 📞 Support

Need help? Check these resources:

1. **Quick Setup**: `QUICK_START.md`
2. **Detailed Docs**: `AUTH_IMPLEMENTATION.md`
3. **SQL Examples**: `Auth_Helper_Queries.sql`
4. **Architecture**: `ARCHITECTURE_DIAGRAM.md`
5. **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Admin user created
- [ ] JWT configuration added
- [ ] Backend builds successfully
- [ ] Azure Functions running
- [ ] Login endpoint tested
- [ ] Signup endpoint tested
- [ ] Student endpoints working
- [ ] Tutor endpoints working
- [ ] Role-based access verified

---

## 📝 Credits

**Built with ❤️ for the Quiz Application**

- Architecture: Modern three-tier design
- Security: Industry best practices
- Documentation: Comprehensive guides
- Code Quality: Production-ready

---

## 📄 License

This implementation is part of the Quiz Application project.

---

**Ready to build amazing quiz experiences! 🚀**

For detailed setup instructions, start with `QUICK_START.md`
