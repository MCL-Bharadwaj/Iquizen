-- TESTING CODE FORMATTING
-- Instructions: Run these queries one by one

-- Step 1: Find a quiz to test with
SELECT quiz_id, title FROM quiz.quizzes ORDER BY created_at DESC LIMIT 3;

-- Step 2: Find questions in that quiz (use quiz_id from above)
-- SELECT q.question_id, q.question_text 
-- FROM quiz.questions q
-- JOIN quiz.quiz_questions qq ON q.question_id = qq.question_id
-- WHERE qq.quiz_id = 'YOUR-QUIZ-ID'::uuid
-- LIMIT 5;

-- Step 3: Update ONE question to test code formatting (use question_id from above)
-- UPDATE quiz.questions
-- SET question_text = 'What will this code print?
--
-- ```python
-- print("Score:", 10)
-- ```'
-- WHERE question_id = 'YOUR-QUESTION-ID'::uuid;

-- Step 4: Verify the update
-- SELECT question_text FROM quiz.questions WHERE question_id = 'YOUR-QUESTION-ID'::uuid;

-- After testing, you can restore the original question text if needed
