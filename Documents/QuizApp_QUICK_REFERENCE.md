# 🎓 Student Module - Quick Reference

## 🚀 Quick Start

### Start Backend
```powershell
cd c:\Users\USER\Desktop\Quizz\Functions\bin\Debug\net8.0
func host start
```
🌐 Backend: `http://localhost:7071`

### Start Frontend  
```powershell
cd c:\Users\USER\Desktop\Quizz\quiz-app
npm run dev
```
🌐 Frontend: `http://localhost:5173`

### Set API Key
```javascript
// Run in browser console (F12)
localStorage.setItem('quiz-api-key', 'your-api-key');
location.reload();
```

---

## 📱 Pages Overview

| Route | Page | Status | Features |
|-------|------|--------|----------|
| `/` | Landing | ✅ | Role selection |
| `/student` | Dashboard | ✅ | Stats, recent activity |
| `/student/quizzes` | Browse Quizzes | ✅ | Search, filter, grid view |
| `/student/quiz/:id` | Take Quiz | ✅ | Question-by-question, submit |
| `/student/attempts` | My Attempts | ✅ | History, filter, retake |

---

## 🔗 API Endpoints Used

| Method | Endpoint | Used In | Purpose |
|--------|----------|---------|---------|
| GET | `/api/quizzes` | Dashboard, Browse | List quizzes |
| GET | `/api/quizzes/:id` | Take Quiz | Quiz details |
| GET | `/api/quizzes/:id/questions` | Take Quiz | Question list |
| POST | `/api/attempts` | Take Quiz | Start attempt |
| POST | `/api/responses` | Take Quiz | Submit answer |
| POST | `/api/attempts/:id/complete` | Take Quiz | Finish quiz |
| GET | `/api/attempts?userId=:id` | Dashboard, Attempts | User history |

---

## 📊 Question Types

### 1️⃣ Multiple Choice (Single)
- **UI**: Radio buttons
- **Answer Format**: `"option-id"`
- **Example**: "What color is the sky?" → Select one

### 2️⃣ Multiple Choice (Multi)
- **UI**: Checkboxes
- **Answer Format**: `["option-id-1", "option-id-2"]`
- **Example**: "Select all fruits" → Select multiple

### 3️⃣ Fill in the Blank
- **UI**: Text input fields
- **Answer Format**: `["text1", "text2"]`
- **Example**: "The ___ sat on the ___" → Type answers

---

## 🎯 User Flow

```
1. Land on homepage → Select "Student"
2. View Dashboard → See stats
3. Click "Browse Quizzes" → See all quizzes
4. Click a quiz → Start taking it
5. Answer questions → Submit
6. View score → Navigate to attempts or browse more
```

---

## 🔍 Testing Quick Checks

### ✅ Checklist
- [ ] All 3 quizzes display
- [ ] Can start a quiz
- [ ] All question types work
- [ ] Can submit quiz
- [ ] Score displays correctly
- [ ] Attempt appears in history
- [ ] Dashboard stats update
- [ ] Search works
- [ ] Filters work
- [ ] Theme toggle works
- [ ] No console errors

### 🐛 Quick Debug
```javascript
// Check API key
console.log(localStorage.getItem('quiz-api-key'));

// Check quiz data
// (After navigating to /student/quizzes)
// Should see: "Fetched quizzes: {data: Array(3), ...}"

// Check network
// F12 → Network tab → Filter: localhost:7071
// All requests should show status 200
```

---

## 📂 Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `TakeQuiz.jsx` | ~250 | Quiz interface |
| `StudentAttempts.jsx` | ~250 | History view |
| `StudentDashboard.jsx` | ~200 | Stats dashboard |
| `StudentQuizzes.jsx` | ~160 | Quiz browser |
| `api.js` | ~300 | API service |

---

## 🎨 Components

### TakeQuiz
- **State**: quiz, questions, answers, attemptId, currentQuestionIndex
- **Features**: Progress bar, navigation, auto-save, submit
- **API Calls**: 6 endpoints

### StudentAttempts
- **State**: attempts, filter
- **Features**: Filter tabs, action buttons, empty state
- **API Calls**: 1 endpoint

### StudentDashboard
- **State**: quizzes, attempts
- **Features**: 4 stat cards, recent lists
- **API Calls**: 2 endpoints

### StudentQuizzes
- **State**: quizzes, searchTerm, filterDifficulty
- **Features**: Search, filter, grid layout
- **API Calls**: 1 endpoint

---

## 🛠️ Common Fixes

### Issue: "Failed to load quizzes"
```powershell
# Test backend
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes"
```

### Issue: 401 Unauthorized
```javascript
// Reset API key
localStorage.setItem('quiz-api-key', 'new-key');
location.reload();
```

### Issue: No questions
```powershell
# Check questions
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes/11111111-1111-1111-1111-111111111111/questions"
```

### Issue: Score shows NaN
- Check all answers submitted (Network tab)
- Verify response payload format
- Check backend scoring logs

---

## 📊 Data Format

### Quiz Response
```json
{
  "data": [
    {
      "quizId": "uuid",
      "title": "Fun with Numbers",
      "estimatedMinutes": 10,
      "difficulty": "easy"
    }
  ],
  "count": 3
}
```

### Attempt Response
```json
{
  "attemptId": "uuid",
  "quizId": "uuid",
  "status": "completed",
  "scorePercentage": 100,
  "totalScore": 35,
  "maxPossibleScore": 35
}
```

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Quiz Display | 3 quizzes | ✅ |
| Question Types | All 3 working | ✅ |
| Score Calculation | Accurate | ✅ |
| Attempt Tracking | Working | ✅ |
| Theme Support | Dark/Light | ✅ |
| Responsive | Mobile/Tablet/Desktop | ✅ |
| API Integration | All endpoints | ✅ |
| Error Handling | Comprehensive | ✅ |

---

## 📚 Documentation

1. **STUDENT_MODULE_COMPLETE.md** - Full feature docs
2. **TESTING_GUIDE.md** - Testing scenarios
3. **CHANGES.md** - Change log
4. **QUICK_REFERENCE.md** - This file

---

## 🚦 Status

**Student Module: COMPLETE ✅**

Ready for user testing!

---

## 📞 Next Steps

After testing Student Module:
1. ✅ Fix any issues found
2. 🔜 Implement Tutor Module
3. 🔜 Implement Content Creator Module
4. 🔜 Add Authentication
5. 🔜 Add Answer Review

---

## 💡 Tips

- Use React DevTools to inspect state
- Check Network tab for API calls
- Enable "Preserve log" in DevTools
- Use `console.log` to debug data flow
- Test in incognito for clean state

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Ready for Testing 🎉
