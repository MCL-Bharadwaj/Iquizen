# 🎓 Quiz Application

A comprehensive quiz management system with role-based access for students, tutors, and content creators.

## 🏗️ Architecture

- **Backend**: Azure Functions (.NET 8) with isolated worker model
- **Frontend**: React 18 with Vite, TailwindCSS
- **Database**: Azure Database for PostgreSQL with JSONB support
- **Authentication**: JWT-based with BCrypt password hashing
- **Hosting**: Azure Functions + Azure Static Web Apps

## 📂 Project Structure

```
Quizz/
├── Functions/              # Azure Functions API (.NET 8)
│   ├── Endpoints/         # API endpoints
│   ├── Helpers/           # Utility functions
│   └── Program.cs         # Function app configuration
├── Auth/                  # Authentication service
├── DataAccess/            # Database layer
├── DataModel/             # Data models and DTOs
├── DatabaseScripts/       # SQL migration scripts
├── quiz-app/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
└── deployment files       # Azure deployment scripts
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/BharadwajSarma/Quizz.git
   cd Quizz
   ```

2. **Set up Database**
   ```bash
   cd DatabaseScripts
   # Run migration scripts in order (000-016)
   psql -U postgres -d your_database < 000_migration_setup.sql
   # ... run other scripts
   ```

3. **Configure Backend**
   - Update `Functions/local.settings.json`:
   ```json
   {
     "Values": {
       "PostgresConnectionString": "Host=localhost;Database=quiz_db;...",
       "JWT__Secret": "your-secret-key-32-chars-minimum",
       "JWT__Issuer": "QuizApp",
       "JWT__Audience": "QuizAppUsers"
     }
   }
   ```

4. **Run Backend**
   ```bash
   cd Functions
   func start
   ```

5. **Run Frontend**
   ```bash
   cd quiz-app
   npm install
   npm run dev
   ```

## ☁️ Azure Deployment

### Quick Deploy (Automated)

```powershell
# 1. Create Azure resources
.\Setup-Azure-Resources.ps1 -ResourceGroup "rg-quizapp-prod" -Location "eastus" -AppName "quizapp-prod"

# 2. Deploy code
.\Deploy-Azure.ps1 -FunctionAppName "func-quizapp-prod" -ResourceGroup "rg-quizapp-prod" -StaticWebAppName "swa-quizapp-prod"
```

### Documentation
- 📖 **Full Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- ⚡ **Quick Reference**: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- 🎯 **Getting Started**: [QUICK_START.md](./QUICK_START.md)

## 👥 User Roles

### Student
- Take quizzes
- View results and attempts
- Track progress

### Tutor
- Create and manage quizzes
- Grade submissions
- View student progress
- Manage questions

### Content Creator
- Create quiz content
- Manage question banks
- Organize quizzes by levels

## 🔐 Authentication

- JWT token-based authentication
- BCrypt password hashing
- Role-based access control (RBAC)
- Secure API key management

## 📊 Features

### Quiz Types
- Multiple Choice (Single/Multi)
- Fill in the Blank
- Short Answer
- Matching
- Ordering
- Program Submission

### Additional Features
- Real-time scoring
- Progress tracking
- Level-based organization
- Attempt history
- Admin dashboard
- Dark mode support

## 🛠️ Tech Stack

### Backend
- Azure Functions (Serverless)
- .NET 8 Isolated Worker
- PostgreSQL with JSONB
- Npgsql (Database driver)
- JWT Authentication
- Swagger/OpenAPI

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

### Infrastructure
- Azure Functions
- Azure Static Web Apps
- Azure Database for PostgreSQL
- Application Insights
- Azure Key Vault (for secrets)

## 📝 API Documentation

Once deployed, access API documentation at:
- **Swagger UI**: `https://your-function-app.azurewebsites.net/internal-docs`

### Key Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration (admin only)
- `GET /api/student/quizzes` - Get available quizzes
- `POST /api/student/quiz/{id}/start` - Start quiz attempt
- `POST /api/tutor/quiz` - Create new quiz
- `GET /api/tutor/responses` - Get submissions for grading

## 🧪 Testing

```bash
# Backend tests
cd Functions
dotnet test

# Frontend tests
cd quiz-app
npm test
```

## 📚 Additional Documentation

- [Build Instructions](./BUILD.md)
- [Database Schema](./DatabaseScripts/SCHEMA_VISUAL.md)
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Testing Guide](./TESTING.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is for educational purposes.

## 🐛 Troubleshooting

See [TROUBLESHOOTING_IN_PROGRESS.md](./TROUBLESHOOTING_IN_PROGRESS.md) for common issues and solutions.

## 💡 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review Application Insights logs (production)

---

**Built with ❤️ using Azure, .NET, and React**