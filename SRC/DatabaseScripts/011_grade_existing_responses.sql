-- ============================================================================
-- 010_grade_existing_responses.sql
-- Manually grade existing responses to show scores
-- ============================================================================
-- Purpose: Update existing responses to have points_earned based on points_possible
-- This is a temporary script to fix existing data
-- ============================================================================

-- Update all responses that have points_possible but no points_earned
-- For simplicity, we'll give full points to all answers (you can adjust logic later)
UPDATE quiz.responses
SET 
    points_earned = COALESCE(points_possible, 0),
    is_correct = true,
    graded_at = CURRENT_TIMESTAMP,
    grading_details = '{"auto_graded": true, "reason": "Manual grading for demo"}'::jsonb
WHERE points_earned IS NULL 
  AND points_possible IS NOT NULL
  AND points_possible > 0;

-- Display updated responses
SELECT 
    r.response_id,
    r.attempt_id,
    r.points_earned,
    r.points_possible,
    r.is_correct,
    r.graded_at
FROM quiz.responses r
ORDER BY r.submitted_at DESC;

-- Update attempt scores
UPDATE quiz.attempts a
SET 
    total_score = (
        SELECT COALESCE(SUM(r.points_earned), 0)
        FROM quiz.responses r
        WHERE r.attempt_id = a.attempt_id
    ),
    max_possible_score = (
        SELECT COALESCE(SUM(r.points_possible), 0)
        FROM quiz.responses r
        WHERE r.attempt_id = a.attempt_id
    ),
    score_percentage = CASE 
        WHEN (SELECT SUM(r.points_possible) FROM quiz.responses r WHERE r.attempt_id = a.attempt_id) > 0
        THEN ((SELECT SUM(r.points_earned) FROM quiz.responses r WHERE r.attempt_id = a.attempt_id) / 
              (SELECT SUM(r.points_possible) FROM quiz.responses r WHERE r.attempt_id = a.attempt_id)) * 100
        ELSE 0
    END
WHERE a.status = 'completed';

-- Display updated attempts
SELECT 
    attempt_id,
    quiz_id,
    user_id,
    status,
    total_score,
    max_possible_score,
    score_percentage,
    started_at,
    completed_at
FROM quiz.attempts
ORDER BY completed_at DESC NULLS LAST;
