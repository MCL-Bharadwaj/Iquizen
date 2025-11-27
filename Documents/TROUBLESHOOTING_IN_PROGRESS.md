# Troubleshooting In-Progress Count Issue

## Current Situation
Your backend is correctly completing quiz attempts (confirmed in logs), but the dashboard shows 68 in_progress attempts that don't decrease.

## Root Cause
You have **68 actual in_progress attempts stuck in the database** from previous test runs. These were created before we fixed the "create on page load" bug. Every time you viewed a quiz, it created a new in_progress attempt.

## Evidence from Logs
```
[19:48:29.163Z] Retrieved 109 attempts for user student_1763632299617_672
[19:49:02.010Z] Retrieved 110 attempts for user student_1763632299617_672  <- After completing one
[19:49:39.950Z] Retrieved 111 attempts for user student_1763632299617_672  <- After completing another
```

The count is increasing (new attempts being created and completed), but the 68 in_progress attempts remain.

## Solution Options

### Option 1: Clean Up Old Test Data (Recommended)
Run the SQL cleanup script to remove or complete old stuck attempts:

```powershell
# Navigate to DatabaseScripts folder
cd C:\Users\USER\Desktop\Quizz\DatabaseScripts

# Run the fix script (review it first!)
psql -h your-db-host -U your-username -d your-database -f Fix-StuckInProgressAttempts.sql
```

**OR** manually delete old test attempts:

```sql
-- SEE ALL ATTEMPTS BY STATUS
SELECT 
    status,
    COUNT(*) as count
FROM quiz.attempts
WHERE user_id = 'student_1763632299617_672'
GROUP BY status;

-- DELETE OLD IN_PROGRESS ATTEMPTS (adjust the time filter as needed)
DELETE FROM quiz.responses
WHERE attempt_id IN (
    SELECT attempt_id
    FROM quiz.attempts
    WHERE user_id = 'student_1763632299617_672'
      AND status = 'in_progress'
      AND started_at < NOW() - INTERVAL '1 hour'
);

DELETE FROM quiz.attempts
WHERE user_id = 'student_1763632299617_672'
  AND status = 'in_progress'
  AND started_at < NOW() - INTERVAL '1 hour';
```

### Option 2: Debug Current State
Open browser console (F12) and check what the frontend receives:

1. Go to Student Dashboard
2. Open Console (F12)
3. Look for these logs:
   ```
   Total attempts received: 111
   Status breakdown: { total: 111, inProgress: 68, completed: 43 }
   ```

This will confirm if the issue is:
- **Database has 68 in_progress** ← Most likely
- **Frontend filtering wrong** ← Less likely (code looks correct)
- **Browser caching** ← Already fixed with cache-busting

### Option 3: Add Auto-Cleanup Feature
Implement automatic cleanup of abandoned attempts (older than X hours):

**Backend**: Add a function to clean up old attempts
**Frontend**: Call it periodically or on dashboard load

## Verification Steps

After cleanup:
1. Hard refresh the dashboard (Ctrl+Shift+R)
2. Check browser console for: `Status breakdown:`
3. The in_progress count should now match reality

## Prevention
The root cause (creating attempts on page load) was already fixed in TakeQuiz.jsx. New attempts are only created when:
1. User starts a new quiz AND
2. User submits their first answer

This means no more stuck attempts will be created going forward.

## Quick Fix Command (PowerShell)

If you have database access configured:

```powershell
# Delete old in_progress attempts and their responses
psql -h localhost -U postgres -d quiz_db -c "
DELETE FROM quiz.responses WHERE attempt_id IN (
    SELECT attempt_id FROM quiz.attempts 
    WHERE user_id = 'student_1763632299617_672' 
    AND status = 'in_progress' 
    AND started_at < NOW() - INTERVAL '1 hour'
);
DELETE FROM quiz.attempts 
WHERE user_id = 'student_1763632299617_672' 
AND status = 'in_progress' 
AND started_at < NOW() - INTERVAL '1 hour';
"
```

Replace connection details (host, user, database name) with your actual values.
