# Student Module Testing Guide

## Prerequisites

### 1. Backend Running
Ensure the Azure Functions backend is running:
```powershell
cd c:\Users\USER\Desktop\Quizz\Functions\bin\Debug\net8.0
func host start
```
✅ Backend should be at: `http://localhost:7071`

### 2. Frontend Running
Ensure the React app is running:
```powershell
cd c:\Users\USER\Desktop\Quizz\quiz-app
npm run dev
```
✅ Frontend should be at: `http://localhost:5173`

### 3. API Key Setup
Open browser console (F12) and run:
```javascript
// Check if API key exists
console.log(localStorage.getItem('quiz-api-key'));

// If not set, add one (use your actual API key)
localStorage.setItem('quiz-api-key', 'your-api-key-here');

// Reload the page
location.reload();
```

To generate an API key:
```powershell
cd c:\Users\USER\Desktop\Quizz
.\Generate-ApiKey.ps1 -Name "Student Frontend" -Description "Frontend API access"
```

## Testing Scenarios

### Scenario 1: Browse Quizzes
**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Student" role card
3. Click "Browse Quizzes" in sidebar or dashboard

**Expected Results:**
- ✅ Should see 3 quizzes: "Fun with Numbers", "Science Explorer", "Coding Basics"
- ✅ Each quiz shows title, description, subject badge, time, difficulty
- ✅ Search box filters quizzes
- ✅ Difficulty dropdown filters quizzes

**Check Browser Console:**
```javascript
// Should see:
Fetched quizzes: {data: Array(3), count: 3, limit: 100, offset: 0}
```

### Scenario 2: Take a Quiz (Complete Flow)
**Steps:**
1. From Browse Quizzes, click on "Fun with Numbers"
2. Quiz automatically starts
3. Answer Question 1 (Multiple Choice Single): Select "Blue"
4. Click "Next"
5. Answer Question 2 (Multiple Choice Multi): Select "Banana" and "Orange"
6. Click "Next"
7. Answer Question 3 (Fill in Blank): Type answers in text fields
8. Click "Submit Quiz"
9. Confirm submission

**Expected Results:**
- ✅ Progress bar shows 1/3, 2/3, 3/3
- ✅ Radio buttons work for single choice
- ✅ Checkboxes work for multiple choice
- ✅ Text inputs work for fill-in-blank
- ✅ Previous button works (disabled on first question)
- ✅ Submit button only appears on last question
- ✅ Completion screen shows score and percentage
- ✅ Can navigate to "View All Attempts" or "Take Another Quiz"

**Check Browser Console:**
```javascript
// Should see API calls:
POST /api/attempts (create attempt)
GET /api/quizzes/{id} (fetch quiz)
GET /api/quizzes/{id}/questions (fetch questions)
POST /api/responses (for each answer submitted)
POST /api/attempts/{id}/complete (finalize)
```

### Scenario 3: View Attempts
**Steps:**
1. After completing a quiz, click "View All Attempts"
2. Or navigate via sidebar: "My Attempts"

**Expected Results:**
- ✅ Shows completed attempt with:
  - Quiz title
  - "Completed" status badge
  - Score percentage (e.g., "100%")
  - Points: X/Y
  - Grade letter (A/B/C/D)
  - Started date/time
  - Completed date/time
  - Duration
- ✅ "Retake Quiz" button works
- ✅ Filter tabs work: All / Completed / In Progress

**Check Browser Console:**
```javascript
// Should see:
Attempts data: {userId: "student-001", attempts: Array(1), count: 1}
```

### Scenario 4: Dashboard Stats
**Steps:**
1. Navigate to Student Dashboard (`/student`)

**Expected Results:**
- ✅ "Available Quizzes" shows count (e.g., 3)
- ✅ "In Progress" shows count (0 if all completed)
- ✅ "Completed" shows count (e.g., 1 after taking quiz)
- ✅ "Average Score" shows percentage (e.g., "100%")
- ✅ Recent Quizzes section shows up to 3 quizzes
- ✅ Recent Attempts section shows up to 3 completed attempts
- ✅ All cards have gradient backgrounds
- ✅ Icons display correctly

### Scenario 5: In-Progress Attempt
**Steps:**
1. Start a quiz
2. Answer first question
3. Close browser tab (or navigate away)
4. Go to "My Attempts"

**Expected Results:**
- ✅ Shows "In Progress" badge
- ✅ Shows play icon (not score)
- ✅ "Continue Quiz" button available
- ✅ Clicking continues from where left off

**Note:** Currently, the app creates a new attempt each time. Mid-quiz resume needs backend support for saving progress.

### Scenario 6: Search and Filter
**Steps:**
1. Go to Browse Quizzes
2. Type "science" in search box
3. Select "Medium" difficulty

**Expected Results:**
- ✅ Only "Science Explorer" shows (if it matches both filters)
- ✅ Clearing filters shows all quizzes again
- ✅ Search is case-insensitive
- ✅ Filter updates immediately

### Scenario 7: Theme Switching
**Steps:**
1. Navigate to any Student page
2. Click theme toggle button (sun/moon icon) in sidebar

**Expected Results:**
- ✅ Entire app switches between light/dark mode
- ✅ All colors adapt properly
- ✅ Text remains readable
- ✅ Cards and buttons have correct contrast

### Scenario 8: Navigation
**Steps:**
1. Use sidebar to navigate between pages:
   - Dashboard
   - Browse Quizzes
   - My Attempts

**Expected Results:**
- ✅ Sidebar highlights active page
- ✅ Page transitions smoothly
- ✅ Back button in browser works
- ✅ All routes work: `/student`, `/student/quizzes`, `/student/attempts`, `/student/quiz/:id`

## Common Issues & Solutions

### Issue 1: "Failed to load quizzes"
**Cause:** Backend not running or wrong URL
**Solution:**
```powershell
# Check if backend is running
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes"

# Should return quiz data
# If error, restart backend:
cd c:\Users\USER\Desktop\Quizz\Functions\bin\Debug\net8.0
func host start
```

### Issue 2: API calls return 401 Unauthorized
**Cause:** Missing or invalid API key
**Solution:**
```javascript
// Check console for API key
console.log(localStorage.getItem('quiz-api-key'));

// Generate new key and set it:
localStorage.setItem('quiz-api-key', 'new-key-from-generate-script');
location.reload();
```

### Issue 3: Quizzes show but quiz doesn't start
**Cause:** Questions not found or attempt creation failed
**Solution:**
```powershell
# Test endpoints directly:
Invoke-RestMethod -Uri "http://localhost:7071/api/quizzes/11111111-1111-1111-1111-111111111111/questions"

# Should return 3 questions
# If empty, check database seed data
```

### Issue 4: Score shows 0 or NaN
**Cause:** Backend scoring logic issue or missing responses
**Solution:**
- Check that all answers were submitted (network tab)
- Verify response payload format matches API expectations
- Check backend logs for scoring calculation errors

### Issue 5: "No Attempts Yet" when attempt was completed
**Cause:** userId mismatch or attempt not saved
**Solution:**
```powershell
# Check attempts in database:
Invoke-RestMethod -Uri "http://localhost:7071/api/attempts?userId=student-001"

# Should show attempts array
# If empty, attempt creation/completion failed
```

## Debug Mode

To enable detailed logging, open browser console and run:
```javascript
// Enable debug mode
localStorage.setItem('debug-mode', 'true');

// Check API responses
// All API calls will log request/response details

// Disable when done
localStorage.removeItem('debug-mode');
```

## Browser DevTools Tips

### Network Tab
- Filter by: `localhost:7071` to see only backend calls
- Check request/response for each API call
- Verify status codes (200 = success, 401 = auth issue, 404 = not found)

### Console Tab
- Look for red errors
- Check logged data structures
- Verify API responses match expected format

### React DevTools
- Install React Developer Tools extension
- Inspect component props and state
- Check if data is being passed correctly

## Performance Metrics

Expected load times:
- Dashboard: < 1 second
- Quiz list: < 1 second
- Quiz start: < 2 seconds
- Question navigation: instant
- Quiz submission: < 2 seconds
- Attempts list: < 1 second

If slower, check:
- Network latency (Network tab)
- Large dataset size
- Backend performance (Functions logs)

## Test Data

### Available Quizzes (from seed data)
1. **Fun with Numbers**
   - Subject: Math
   - Difficulty: Easy
   - Duration: 10 minutes
   - Questions: 3

2. **Science Explorer**
   - Subject: Science
   - Difficulty: Medium
   - Duration: 15 minutes
   - Questions: 3

3. **Coding Basics**
   - Subject: Computer Science
   - Difficulty: Medium
   - Duration: 20 minutes
   - Questions: 3

### Question Types in "Fun with Numbers"
1. Multiple Choice (Single): "What color is the sky?"
2. Multiple Choice (Multi): "Which are fruits?"
3. Fill in Blank: "The ___ sat on the ___"

## Success Criteria

✅ All 3 quizzes display correctly  
✅ Can complete a quiz end-to-end  
✅ Score is calculated and displayed  
✅ Attempt appears in My Attempts  
✅ Dashboard stats update after taking quiz  
✅ Search and filters work  
✅ Theme toggle works  
✅ All navigation works  
✅ No console errors  
✅ All API calls succeed (200 status)  

## Reporting Issues

When reporting issues, include:
1. Browser console screenshot (F12 → Console tab)
2. Network tab screenshot showing failed request
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser and OS version

## Ready to Test!

Follow the scenarios above in order. The complete flow should take about 10-15 minutes to test thoroughly.

**Happy Testing!** 🧪✨
