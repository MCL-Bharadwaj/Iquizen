# Quiz Platform - Multi-Role Frontend

## 🎯 Overview

This is a **role-based quiz platform** with three distinct user types:
- **Students**: Take quizzes and view results
- **Tutors**: Create quizzes, manage questions, and grade submissions  
- **Content Creators**: Create quizzes and questions only

## 🚀 Getting Started

### Prerequisites
- Backend running at `http://localhost:7071` (Azure Functions)
- Node.js installed
- npm or yarn

### Installation
```bash
cd quiz-app
npm install
npm run dev
```

The app will be available at: **http://localhost:5173/**

## 📱 User Access

### Direct Dashboard Links

Since there's **no login system**, give users these direct links:

- **Students**: `http://localhost:5173/student/dashboard`
- **Tutors**: `http://localhost:5173/tutor/dashboard`
- **Content Creators**: `http://localhost:5173/creator/dashboard`

Or users can select their role from: `http://localhost:5173/`

## 🏗️ Application Structure

```
quiz-app/
├── src/
│   ├── pages/
│   │   ├── RoleSelector.jsx          # Landing page for role selection
│   │   ├── Student/
│   │   │   ├── StudentDashboard.jsx  # ✅ Student dashboard with stats
│   │   │   ├── StudentQuizzes.jsx    # ✅ Browse and start quizzes
│   │   │   ├── TakeQuiz.jsx          # 🚧 Quiz taking interface
│   │   │   └── StudentAttempts.jsx   # 🚧 View attempt history
│   │   ├── Tutor/
│   │   │   ├── TutorDashboard.jsx    # 🚧 Tutor dashboard
│   │   │   ├── TutorQuizzes.jsx      # 🚧 Manage quizzes
│   │   │   ├── CreateQuiz.jsx        # 🚧 Create quiz form
│   │   │   ├── ManageQuestions.jsx   # 🚧 Add/edit questions
│   │   │   └── GradeAttempts.jsx     # 🚧 Grade student submissions
│   │   └── ContentCreator/
│   │       ├── CreatorDashboard.jsx  # 🚧 Creator dashboard
│   │       ├── CreatorQuizzes.jsx    # 🚧 View created quizzes
│   │       └── CreatorCreateQuiz.jsx # 🚧 Create quiz form
│   ├── components/
│   │   └── Sidebar.jsx               # ✅ Role-specific navigation
│   ├── services/
│   │   └── api.js                    # ✅ All backend API calls
│   └── App.jsx                       # ✅ Router configuration
```

## ✅ Completed Features

### 1. **Role-Based Routing** ✅
- Landing page with role selection
- Separate routes for each user type
- Role-specific sidebars

### 2. **Student Features** ✅
- Dashboard with statistics (quizzes available, attempts, scores)
- Browse all available quizzes
- Search and filter quizzes by difficulty
- Unique user ID generation per student

### 3. **API Integration** ✅
All backend endpoints connected:
- Quiz CRUD operations
- Question management
- Attempt tracking
- Response submissions
- Grading functionality

### 4. **UI/UX** ✅
- Dark/Light mode toggle
- Responsive design
- Modern gradient styling
- Loading states
- Error handling

## 🚧 To Be Implemented

### Student Features
- [ ] **Take Quiz Page**: Display questions, collect answers
- [ ] **Submit Quiz**: Send answers to backend
- [ ] **View Results**: Show score and correct answers
- [ ] **Attempt History**: List all past attempts with scores

### Tutor Features
- [ ] **Tutor Dashboard**: Statistics on quizzes created, submissions received
- [ ] **Create Quiz Form**: Full form with validation
- [ ] **Add Questions**: Question builder with different types
- [ ] **View Submissions**: List of student attempts requiring grading
- [ ] **Grade Interface**: Review answers and assign marks
- [ ] **Send Feedback**: Return graded quiz to students

### Content Creator Features
- [ ] **Creator Dashboard**: Statistics on content created
- [ ] **Create Quiz**: Same as tutor but without grading access
- [ ] **Manage Questions**: Add/edit/delete questions

## 🔌 API Endpoints Used

### Quiz API
```javascript
quizApi.getQuizzes({ limit: 100 })           // GET /api/quizzes
quizApi.getQuizById(quizId)                   // GET /api/quizzes/:id
quizApi.getQuizQuestions(quizId)              // GET /api/quizzes/:id/questions
quizApi.createQuiz(data)                      // POST /api/quizzes
quizApi.updateQuiz(id, data)                  // PUT /api/quizzes/:id
quizApi.deleteQuiz(id)                        // DELETE /api/quizzes/:id
```

### Question API
```javascript
questionApi.getQuestions()                    // GET /api/questions
questionApi.getQuestionById(id)               // GET /api/questions/:id
questionApi.createQuestion(data)              // POST /api/questions
questionApi.deleteQuestion(id)                // DELETE /api/questions/:id
```

### Attempt API
```javascript
attemptApi.startAttempt(quizId, userId, metadata)  // POST /api/attempts
attemptApi.getAttemptById(id)                      // GET /api/attempts/:id
attemptApi.getUserAttempts(userId)                 // GET /api/attempts?userId=xxx
attemptApi.getAttemptResponses(id)                 // GET /api/attempts/:id/responses
attemptApi.completeAttempt(id)                     // POST /api/attempts/:id/complete
```

### Response API
```javascript
responseApi.submitAnswer(attemptId, questionId, answer, points)  // POST /api/responses
responseApi.getResponseById(id)                                   // GET /api/responses/:id
responseApi.gradeResponse(id, points, isCorrect, details)        // POST /api/responses/:id/grade
```

## 💾 User ID Management

Each role has a unique user ID stored in localStorage:
- **Student**: `userId_student`
- **Tutor**: `userId_tutor`
- **Content Creator**: `userId_content_creator`

Format: `{role}_{timestamp}_{random}`

Example: `student_1700000000000_123`

## 🗄️ Database Considerations

### Current Limitations (No Auth System)
- User IDs are generated client-side
- No role enforcement in database
- No user table exists

### What Works Without DB Changes
✅ Students can take quizzes
✅ Attempts are tracked by user_id
✅ Tutors can create quizzes
✅ Responses are stored

### What Needs DB Changes for Full Implementation
⚠️ **Role tracking** - Need to store who created what
⚠️ **Evaluation workflow** - Need status tracking (pending/graded/returned)
⚠️ **Quiz visibility** - Need is_published flag

## 🎨 Theme Support

Toggle between dark and light modes:
- Persistent across sessions (localStorage)
- Consistent across all pages
- Role-specific color gradients:
  - **Student**: Blue/Cyan
  - **Tutor**: Purple/Pink
  - **Content Creator**: Orange/Red

## 🧪 Testing the App

### 1. Start Backend
```bash
cd Functions
func start
```
Backend should be at: `http://localhost:7071`

### 2. Start Frontend
```bash
cd quiz-app
npm run dev
```
Frontend at: `http://localhost:5173`

### 3. Test Student Flow
1. Go to `http://localhost:5173/`
2. Click "Student"
3. See dashboard with quiz statistics
4. Click "My Quizzes"
5. Click on a quiz to start (placeholder page currently)

### 4. Test Tutor Flow
1. Go to `http://localhost:5173/tutor/dashboard`
2. Navigate to create quiz (placeholder currently)

### 5. Test Content Creator Flow
1. Go to `http://localhost:5173/creator/dashboard`
2. View created content (placeholder currently)

## 📝 Next Steps

### Priority 1: Student Quiz Taking
1. Build TakeQuiz component
2. Fetch questions for selected quiz
3. Display questions one by one or all at once
4. Collect answers
5. Submit to backend
6. Show results

### Priority 2: Tutor Quiz Creation
1. Build CreateQuiz form
2. Add validation
3. Build question creation interface
4. Support different question types
5. Link questions to quiz

### Priority 3: Grading Workflow
1. Build GradeAttempts page
2. List pending submissions
3. Show student answers
4. Input marks
5. Send graded attempts back

### Priority 4: Content Creator
1. Simplified quiz creation (same as tutor)
2. Question builder
3. No access to grading features

## 🔗 Important Files

- **App.jsx**: Main routing configuration
- **Sidebar.jsx**: Role-based navigation
- **api.js**: All backend API calls
- **RoleSelector.jsx**: Landing page

## 🐛 Known Issues

1. **Placeholders**: Most pages are placeholders currently
2. **No validation**: Forms need input validation
3. **No error boundaries**: Need React error boundaries
4. **User IDs**: Generated client-side (no auth)

## 🤝 Contributing

To add a new page:
1. Create component in appropriate folder (`Student/`, `Tutor/`, or `ContentCreator/`)
2. Add route in `App.jsx`
3. Add nav link in `Sidebar.jsx` if needed
4. Use `isDark` prop for theming

## 📞 Support

For questions or issues, contact the development team.

---

**Status**: 🚧 Work in Progress
**Version**: 0.1.0
**Last Updated**: November 20, 2025
