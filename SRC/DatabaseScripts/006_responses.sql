-- ============================================================================
-- 005_responses.sql
-- Create `responses` table (answers + scores) and related indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('005-responses', 'Create responses table and indexes', '005_responses.sql');
END $$;

-- TABLE: responses
CREATE TABLE IF NOT EXISTS quiz.responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz.attempts(attempt_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz.questions(question_id),
    answer_payload JSONB NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW(),
    points_earned DECIMAL(10,2) CHECK (points_earned >= 0),
    points_possible DECIMAL(10,2) CHECK (points_possible >= 0),
    is_correct BOOLEAN,
    grading_details JSONB,
    graded_at TIMESTAMP,
    CONSTRAINT unique_response_per_question UNIQUE (attempt_id, question_id),
    CONSTRAINT graded_data_valid CHECK (
        (graded_at IS NOT NULL AND points_earned IS NOT NULL AND points_possible IS NOT NULL) OR
        (graded_at IS NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON quiz.responses(attempt_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON quiz.responses(question_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_responses_is_correct ON quiz.responses(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_graded_at ON quiz.responses(graded_at DESC) WHERE graded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_answer_payload ON quiz.responses USING GIN(answer_payload);
CREATE INDEX IF NOT EXISTS idx_responses_grading_details ON quiz.responses USING GIN(grading_details);

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '005-responses';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'responses table created with indexes');
END $$;
