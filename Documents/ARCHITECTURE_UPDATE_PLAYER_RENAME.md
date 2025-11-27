# Architecture Update: Student → Player Rename

## Date: 2025

## Overview
Renamed "Student" to "Player" throughout the Quiz application to better reflect the gaming/quiz-taking context and separate it from the LMS educational context.

## Rationale
- **Clear Domain Separation**: LMS handles "Students" (educational role), Quiz app handles "Players" (gaming participants)
- **Contextual Clarity**: In the quiz context, participants are playing/taking quizzes, not studying
- **Architecture Alignment**: Quiz app is a standalone gaming module that can integrate with any LMS

## Changes Made

### Backend (C# Function App)

#### Files Renamed
- `StudentEndpoints.cs` → `PlayerEndpoints.cs`

#### Classes/DTOs Renamed
- `StudentEndpoints` → `PlayerEndpoints`
- `StudentLevelInfo` → `PlayerLevelInfo`
- `StudentResponseForTutor` → `PlayerResponseForTutor`

#### Properties Renamed
- `StudentCount` → `PlayerCount`
- `StudentUsername` → `PlayerUsername`
- `StudentFullName` → `PlayerFullName`

#### Methods Renamed
- `GetStudentResponses` → `GetPlayerResponses`
- `GetStudentLevels` → `GetPlayerLevels`
- `AuthorizeStudent` → `AuthorizePlayer`

#### Variables Renamed (ResponseFunctions.cs)
- `studentAnswer` → `playerAnswer`
- `studentAnswerJson` → `playerAnswerJson`
- `studentAnswerElement` → `playerAnswerElement`
- `studentSelection` → `playerSelection`
- `studentTFValue` → `playerTFValue`
- `studentPairs` → `playerPairs`
- `studentOrder` → `playerOrder`
- `studentList` → `playerList`
- `studentSet` → `playerSet`
- `studentAnswersElement` → `playerAnswersElement`

#### SQL Aliases Renamed (TutorEndpoints.cs)
- `student_username` → `player_username`
- `student_full_name` → `player_full_name`
- `student_count` → `player_count`

#### Routes Renamed
- `/api/student/*` → `/api/player/*`
- `/api/student/levels` → `/api/player/levels`
- `/api/student/quizzes` → `/api/player/quizzes`

#### Default Role Value
- `Role = "student"` → `Role = "player"`

#### Comments Updated
- "Auto-grade answer by comparing student response" → "Auto-grade answer by comparing player response"
- "Expected roles: student (own attempts)" → "Expected roles: player (own attempts)"
- "Level with quiz count for students" → "Level with quiz count for players"

### Frontend (React)

#### Folders Renamed
- `src/pages/Student/` → `src/pages/Player/`

#### Files Renamed
- `StudentAttempts.jsx` → `PlayerAttempts.jsx`
- `StudentDashboard.jsx` → `PlayerDashboard.jsx`
- `StudentQuizzes.jsx` → `PlayerQuizzes.jsx`
- `TutorStudentQuizzes.jsx` → `TutorPlayerQuizzes.jsx`
- `TutorQuizStudents.jsx` → `TutorQuizPlayers.jsx`

#### Components Renamed
- `TutorStudentQuizzes` → `TutorPlayerQuizzes`
- `TutorQuizStudents` → `TutorQuizPlayers`
- `StudentAttempts` → `PlayerAttempts`
- `StudentDashboard` → `PlayerDashboard`
- `StudentQuizzes` → `PlayerQuizzes`

#### Variables Renamed
- `studentId` → `playerId`
- `studentName` → `playerName`
- `studentNames` → `playerNames`
- `students` → `players`
- `actualStudentId` → `actualPlayerId`
- `allStudents` → `allPlayers`
- `studentsWithAttempts` → `playersWithAttempts`

#### LocalStorage Keys
- `'userId_student'` → `'userId_player'`

#### API Route References
- `'/api/student/*'` → `'/api/player/*'`

### Database

#### Role Values
The default role value in `quiz.users` table:
- Old: `"student"`
- New: `"player"`

**Note**: If you have existing data with `role = 'student'`, you may need to run:
```sql
UPDATE quiz.users SET role = 'player' WHERE role = 'student';
```

### Build Status
✅ Backend build: **0 errors, 58 warnings** (pre-existing)
✅ All references updated consistently

## What Was NOT Changed

### Unchanged Components
- LMS authentication tables (already removed in previous cleanup)
- `Student.cs` entity file (retained but unused - `lms.students` table was removed)
- Core quiz functionality (quizzes, questions, attempts, responses)
- Token validation logic (TokenService, AuthorizationService)
- Database schema (`quiz.*` tables remain unchanged)

### Notes on Unused Files
- `Student.cs` entity class still exists but is unused (LMS auth tables were removed)
- Can be deleted or kept for reference purposes

## Migration Guide

### For Existing Deployments

1. **Update Backend Code**:
   - Pull latest changes
   - Rebuild Function App
   - Redeploy to Azure

2. **Update Frontend Code**:
   - Update all imports referencing old Student components
   - Update any hardcoded routes from `/student/*` to `/player/*`
   - Rebuild and redeploy

3. **Update Database** (if you have existing data):
   ```sql
   -- Update existing role values
   UPDATE quiz.users SET role = 'player' WHERE role = 'student';
   ```

4. **Update API Clients**:
   - Any external systems calling `/api/student/*` must update to `/api/player/*`

5. **Update Documentation**:
   - Review and update any project documentation referencing "student" in quiz context
   - Note: LMS authentication documentation is obsolete (auth removed)

### Testing Checklist

- [ ] Player can access `/api/player/levels` with valid token
- [ ] Player can access `/api/player/quizzes` with valid token
- [ ] Tutor can view player responses via `/api/tutor/player-responses`
- [ ] Frontend player dashboard loads correctly
- [ ] Tutor dashboard shows players (not students)
- [ ] Quiz taking flow works end-to-end
- [ ] Authorization still works correctly (role-based access)

## Architecture Context

### Current Architecture (After Changes)
```
┌─────────────┐
│     LMS     │ ← Handles Authentication
│   (External)│ ← Issues JWT tokens with (userId, email, roles)
└──────┬──────┘
       │ JWT Token
       ▼
┌─────────────────────────────────┐
│      Quiz Application           │
│                                 │
│  ┌──────────────────────────┐  │
│  │  TokenService            │  │ ← Validates JWT tokens
│  │  (JWT Validation)        │  │
│  └──────────────────────────┘  │
│               │                 │
│               ▼                 │
│  ┌──────────────────────────┐  │
│  │  PlayerEndpoints         │  │ ← Player quiz access
│  │  /api/player/*           │  │
│  └──────────────────────────┘  │
│               │                 │
│  ┌──────────────────────────┐  │
│  │  TutorEndpoints          │  │ ← Tutor views player responses
│  │  /api/tutor/*            │  │
│  └──────────────────────────┘  │
│               │                 │
│               ▼                 │
│  ┌──────────────────────────┐  │
│  │  DbService               │  │ ← Raw SQL queries
│  │  (Npgsql)                │  │
│  └──────────────────────────┘  │
│               │                 │
└───────────────┼─────────────────┘
                ▼
       ┌────────────────┐
       │   PostgreSQL   │
       │  quiz.* schema │
       └────────────────┘
```

### Role Definitions
- **Player**: Quiz participant (previously "student")
- **Tutor**: Quiz creator and player response viewer
- **Admin**: System administrator (if implemented)

## Related Documents
- `ARCHITECTURE_DIAGRAM.md` - Overall system architecture (may need update)
- `Functions_Endpoints_README.md` - API endpoint documentation (may need update)
- `QuizApp_README.md` - Frontend documentation (may need update)

## Impact Assessment

### Breaking Changes
- ✅ **API Routes**: All `/api/student/*` routes changed to `/api/player/*`
- ✅ **Frontend Routes**: All `/student/*` routes changed to `/player/*`
- ✅ **LocalStorage Keys**: `userId_student` changed to `userId_player`

### Non-Breaking Changes
- ✅ **Database Schema**: No changes to table structure
- ✅ **JWT Token Format**: No changes (LMS continues to issue same tokens)
- ✅ **Authorization Logic**: No functional changes, just naming

### Recommended Actions
1. Update any API documentation or Swagger/OpenAPI specs
2. Update frontend environment variables if they reference "student"
3. Update any monitoring/logging that filters by "student" endpoints
4. Update any CI/CD scripts that reference "student" routes for testing

## Conclusion
This rename improves code clarity by separating educational (LMS Student) from gaming (Quiz Player) contexts, making the Quiz application a more modular, reusable component that can integrate with any authentication system.
