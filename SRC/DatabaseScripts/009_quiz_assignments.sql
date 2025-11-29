-- ============================================================================
-- 009_quiz_assignments.sql
-- Create `quiz_assignments` table to track assigned quizzes to users
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('009-quiz-assignments', 'Create quiz_assignments table and indexes', '009_quiz_assignments.sql');
END $$;

-- TABLE: quiz_assignments
-- Purpose: Track which quizzes are assigned to which users
CREATE TABLE IF NOT EXISTS quiz.quiz_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quiz.quizzes(quiz_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES lms.users(user_id) ON DELETE CASCADE,
    assigned_by VARCHAR(255), -- Who assigned the quiz (teacher, admin, etc.)
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP, -- When the quiz should be completed
    status VARCHAR(50) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue', 'cancelled')),
    started_at TIMESTAMP, -- When user first started the quiz
    completed_at TIMESTAMP, -- When user finished the quiz
    score DECIMAL(10,2), -- Final score (0-100 percentage)
    max_attempts INT DEFAULT NULL, -- Maximum attempts allowed (NULL = unlimited)
    attempts_used INT DEFAULT 0, -- Number of attempts used
    is_mandatory BOOLEAN DEFAULT false, -- Is this a required assignment?
    notes TEXT, -- Additional notes or instructions for the student
    metadata JSONB, -- Additional flexible data (e.g., class_id, group_id, tags)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (
        (due_date IS NULL OR due_date > assigned_at) AND
        (started_at IS NULL OR started_at >= assigned_at) AND
        (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at))
    ),
    CONSTRAINT valid_attempts CHECK (
        (max_attempts IS NULL OR max_attempts > 0) AND
        (attempts_used >= 0) AND
        (max_attempts IS NULL OR attempts_used <= max_attempts)
    ),
    CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT completed_has_score CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    ),
    -- Prevent duplicate assignments
    CONSTRAINT unique_assignment UNIQUE (quiz_id, user_id, assigned_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON quiz.quiz_assignments(user_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_quiz_id ON quiz.quiz_assignments(quiz_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON quiz.quiz_assignments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON quiz.quiz_assignments(due_date) WHERE due_date IS NOT NULL AND status NOT IN ('completed', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON quiz.quiz_assignments(assigned_by) WHERE assigned_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_mandatory ON quiz.quiz_assignments(is_mandatory, status) WHERE is_mandatory = true;
CREATE INDEX IF NOT EXISTS idx_assignments_metadata ON quiz.quiz_assignments USING GIN(metadata);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION quiz.update_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trg_update_assignment_timestamp
BEFORE UPDATE ON quiz.quiz_assignments
FOR EACH ROW
EXECUTE FUNCTION quiz.update_assignment_timestamp();

-- Function to automatically update status to 'overdue'
CREATE OR REPLACE FUNCTION quiz.update_overdue_assignments()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE quiz.quiz_assignments
    SET status = 'overdue'
    WHERE status IN ('assigned', 'in_progress')
      AND due_date IS NOT NULL
      AND due_date < NOW()
      AND completed_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- View to get assignment summary for users
CREATE OR REPLACE VIEW quiz.v_user_assignments AS
SELECT 
    qa.assignment_id,
    qa.user_id,
    qa.quiz_id,
    q.title AS quiz_title,
    q.description AS quiz_description,
    q.subject,
    q.difficulty,
    q.estimated_minutes,
    qa.assigned_at,
    qa.due_date,
    qa.status,
    qa.started_at,
    qa.completed_at,
    qa.score,
    qa.max_attempts,
    qa.attempts_used,
    qa.is_mandatory,
    qa.notes,
    qa.assigned_by,
    CASE 
        WHEN qa.due_date IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (qa.due_date - NOW())) / 3600 -- Hours until due
        ELSE NULL 
    END AS hours_until_due,
    CASE 
        WHEN qa.completed_at IS NOT NULL AND qa.started_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at)) / 60 -- Minutes to complete
        ELSE NULL
    END AS completion_time_minutes
FROM quiz.quiz_assignments qa
JOIN quiz.quizzes q ON qa.quiz_id = q.quiz_id
WHERE q.is_published = true;

-- View to get assignment statistics
CREATE OR REPLACE VIEW quiz.v_assignment_stats AS
SELECT 
    quiz_id,
    COUNT(*) AS total_assignments,
    COUNT(*) FILTER (WHERE status = 'assigned') AS assigned_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    AVG(score) FILTER (WHERE status = 'completed') AS avg_score,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) FILTER (WHERE status = 'completed' AND started_at IS NOT NULL) AS avg_completion_minutes,
    COUNT(*) FILTER (WHERE is_mandatory = true) AS mandatory_count
FROM quiz.quiz_assignments
GROUP BY quiz_id;

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '009-quiz-assignments';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'quiz_assignments table created with indexes, triggers, and views');
END $$;
