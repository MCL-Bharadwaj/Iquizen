# Quiz Assignment Endpoints - API Documentation

## Overview
Complete REST API for managing quiz assignments with JWT token validation and role-based authorization.

## Authentication
All endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Authorization Roles
- **Administrator**: Full access to all assignment operations
- **Tutors**: Can create, view, update, and manage all assignments
- **Content Creator**: Can create, view, update, and manage all assignments
- **Player**: Can view and interact with their own assignments only

---

## Endpoints

### 1. Create Assignment
**POST** `/api/assignments`

**Authorization**: Administrator, Tutors, or Content Creator

**Request Body**:
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user@example.com",
  "dueDate": "2025-12-31T23:59:59Z",
  "maxAttempts": 3,
  "isMandatory": true,
  "notes": "Please complete before the deadline",
  "metadata": {
    "classId": "CS101",
    "semester": "Fall 2025"
  }
}
```

**Response** (201 Created):
```json
{
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizTitle": "Introduction to Programming",
  "userId": "user@example.com",
  "assignedBy": "admin@example.com",
  "assignedAt": "2025-11-28T10:00:00Z",
  "dueDate": "2025-12-31T23:59:59Z",
  "status": "assigned",
  "maxAttempts": 3,
  "attemptsUsed": 0,
  "isMandatory": true,
  "notes": "Please complete before the deadline"
}
```

---

### 2. Bulk Create Assignments
**POST** `/api/assignments/bulk`

**Authorization**: Administrator, Tutors, or Content Creator

**Request Body**:
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userIds": [
    "student1@example.com",
    "student2@example.com",
    "student3@example.com"
  ],
  "dueDate": "2025-12-31T23:59:59Z",
  "maxAttempts": 3,
  "isMandatory": true,
  "notes": "Complete this quiz as part of your coursework"
}
```

**Response** (200 OK):
```json
{
  "successCount": 3,
  "failureCount": 0,
  "createdAssignments": [
    { /* assignment details */ },
    { /* assignment details */ },
    { /* assignment details */ }
  ],
  "errors": []
}
```

---

### 3. Get All Assignments (with filters)
**GET** `/api/assignments?userId={userId}&quizId={quizId}&status={status}`

**Authorization**: Administrator, Tutors, or Content Creator

**Query Parameters**:
- `userId` (optional): Filter by user
- `quizId` (optional): Filter by quiz
- `status` (optional): Filter by status (assigned, in_progress, completed, overdue, cancelled)

**Response** (200 OK):
```json
[
  {
    "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
    "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quizTitle": "Introduction to Programming",
    "userId": "student@example.com",
    "assignedBy": "admin@example.com",
    "assignedAt": "2025-11-28T10:00:00Z",
    "dueDate": "2025-12-31T23:59:59Z",
    "status": "assigned",
    "maxAttempts": 3,
    "attemptsUsed": 0,
    "isMandatory": true,
    "hoursUntilDue": 792.5,
    "score": null
  }
]
```

---

### 4. Get My Assignments (Player View)
**GET** `/api/assignments/my?status={status}`

**Authorization**: Any authenticated user

**Query Parameters**:
- `status` (optional): Filter by status

**Response** (200 OK):
```json
[
  {
    "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
    "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quizTitle": "Introduction to Programming",
    "status": "assigned",
    "dueDate": "2025-12-31T23:59:59Z",
    "hoursUntilDue": 792.5,
    "isMandatory": true,
    "notes": "Complete this quiz as part of your coursework"
  }
]
```

---

### 5. Get Assignment Details
**GET** `/api/assignments/{assignmentId}`

**Authorization**: Owner (Player) or Administrator/Tutors/Content Creator

**Response** (200 OK):
```json
{
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizTitle": "Introduction to Programming",
  "quizDescription": "Learn the basics of programming",
  "subject": "Computer Science",
  "difficulty": "Beginner",
  "estimatedMinutes": 30,
  "userId": "student@example.com",
  "assignedBy": "admin@example.com",
  "assignedAt": "2025-11-28T10:00:00Z",
  "dueDate": "2025-12-31T23:59:59Z",
  "status": "in_progress",
  "startedAt": "2025-11-28T14:00:00Z",
  "completedAt": null,
  "score": null,
  "maxAttempts": 3,
  "attemptsUsed": 1,
  "isMandatory": true,
  "notes": "Complete this quiz as part of your coursework",
  "hoursUntilDue": 788.5
}
```

---

### 6. Update Assignment
**PUT** `/api/assignments/{assignmentId}`

**Authorization**: Administrator, Tutors, or Content Creator

**Request Body**:
```json
{
  "dueDate": "2025-12-31T23:59:59Z",
  "maxAttempts": 5,
  "isMandatory": false,
  "notes": "Updated instructions",
  "status": "assigned"
}
```

**Response** (200 OK):
```json
{
  "message": "Assignment updated successfully",
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 7. Start Assignment (Player Action)
**POST** `/api/assignments/{assignmentId}/start`

**Authorization**: Owner (Player) only

**Response** (200 OK):
```json
{
  "message": "Assignment started successfully",
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress",
  "startedAt": "2025-11-28T14:00:00Z",
  "attemptsUsed": 1
}
```

---

### 8. Complete Assignment (Player Action)
**POST** `/api/assignments/{assignmentId}/complete`

**Authorization**: Owner (Player) only

**Request Body**:
```json
{
  "score": 85.5
}
```

**Response** (200 OK):
```json
{
  "message": "Assignment completed successfully",
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "completedAt": "2025-11-28T15:30:00Z",
  "score": 85.5
}
```

---

### 9. Cancel Assignment
**DELETE** `/api/assignments/{assignmentId}`

**Authorization**: Administrator, Tutors, or Content Creator

**Response** (200 OK):
```json
{
  "message": "Assignment cancelled successfully"
}
```

---

### 10. Get Assignment Statistics
**GET** `/api/assignments/stats/{quizId}`

**Authorization**: Administrator, Tutors, or Content Creator

**Response** (200 OK):
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "totalAssignments": 50,
  "assignedCount": 15,
  "inProgressCount": 20,
  "completedCount": 12,
  "overdueCount": 3,
  "cancelledCount": 0,
  "averageScore": 78.5,
  "averageCompletionMinutes": 25.3,
  "mandatoryCount": 35
}
```

---

## Status Values
- `assigned`: Assignment created but not started
- `in_progress`: Student has started the quiz
- `completed`: Student has finished the quiz
- `overdue`: Past due date and not completed
- `cancelled`: Assignment was cancelled

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authorization header is required"
}
```

### 403 Forbidden
```json
{
  "error": "This operation requires one of the following roles: Administrator, Tutors, Content Creator"
}
```

### 404 Not Found
```json
{
  "error": "Assignment not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid assignment data"
}
```

---

## Usage Examples

### Example 1: Create Assignment (cURL)
```bash
curl -X POST http://localhost:7071/api/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "student@example.com",
    "dueDate": "2025-12-31T23:59:59Z",
    "maxAttempts": 3,
    "isMandatory": true
  }'
```

### Example 2: Get My Assignments (JavaScript)
```javascript
const response = await fetch('http://localhost:7071/api/assignments/my', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const assignments = await response.json();
console.log(assignments);
```

### Example 3: Start Assignment (JavaScript)
```javascript
const response = await fetch(`http://localhost:7071/api/assignments/${assignmentId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log(result);
```

---

## Testing

### Test Flow:
1. **Login** → Get JWT token
2. **Create Assignment** (as Tutor/Admin)
3. **Get My Assignments** (as Player)
4. **Start Assignment** (as Player)
5. **Complete Assignment** (as Player with score)
6. **Get Statistics** (as Tutor/Admin)

---

## Database Tables Used
- `quiz.quiz_assignments` - Main assignment table
- `quiz.v_user_assignments` - View with quiz details
- `quiz.v_assignment_stats` - Statistics view

---

## Files Created
1. ✅ `DataModel/Dtos/AssignmentDtos.cs` - DTOs for assignments
2. ✅ `HTTP/Assignment/AssignmentFunctions.cs` - API endpoints

## Authorization Matrix

| Endpoint | Player | Tutors | Content Creator | Administrator |
|----------|--------|--------|-----------------|---------------|
| Create Assignment | ❌ | ✅ | ✅ | ✅ |
| Bulk Create | ❌ | ✅ | ✅ | ✅ |
| Get All Assignments | ❌ | ✅ | ✅ | ✅ |
| Get My Assignments | ✅ | ✅ | ✅ | ✅ |
| Get Assignment Details | ✅ (own) | ✅ | ✅ | ✅ |
| Update Assignment | ❌ | ✅ | ✅ | ✅ |
| Start Assignment | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| Complete Assignment | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| Cancel Assignment | ❌ | ✅ | ✅ | ✅ |
| Get Statistics | ❌ | ✅ | ✅ | ✅ |
