-- ============================================================================
-- 004_attempts.sql
-- Create `attempts` table, constraints and indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('004-attempts', 'Create attempts table, constraints and indexes', '004_attempts.sql');
END $$;

-- TABLE: attempts
CREATE TABLE IF NOT EXISTS quiz.attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quiz.quizzes(quiz_id),
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_score DECIMAL(10,2) CHECK (total_score >= 0),
    max_possible_score DECIMAL(10,2) CHECK (max_possible_score >= 0),
    metadata JSONB,
    CONSTRAINT completed_timestamp_valid_attempts CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON quiz.attempts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz.attempts(quiz_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON quiz.attempts(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_quiz ON quiz.attempts(user_id, quiz_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_completed_score ON quiz.attempts(completed_at DESC, total_score DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_attempts_metadata ON quiz.attempts USING GIN(metadata);

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '004-attempts';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'attempts table created with indexes');
END $$;
