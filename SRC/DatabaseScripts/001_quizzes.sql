-- ============================================================================
-- 001_quizzes.sql
-- Create `quizzes` table, constraints and indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('001-quizzes', 'Create quizzes table, constraints and indexes', '001_quizzes.sql');
END $$;

-- Create or replace update_updated_at function (idempotent)
CREATE OR REPLACE FUNCTION quiz.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: quizzes
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz.quizzes (
    quiz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    age_min INT CHECK (age_min >= 3 AND age_min <= 18),
    age_max INT CHECK (age_max >= 3 AND age_max <= 18),
    subject VARCHAR(100),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_minutes INT CHECK (estimated_minutes > 0),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT age_range_valid_quiz CHECK (age_max >= age_min)
);

-- Trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quiz.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION quiz.update_updated_at_column();

-- Indexes for quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_age_range ON quiz.quizzes(age_min, age_max) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_difficulty ON quiz.quizzes(subject, difficulty) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_tags ON quiz.quizzes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_quizzes_deleted_at ON quiz.quizzes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quiz.quizzes(created_at DESC) WHERE deleted_at IS NULL;

-- Additional constraints (use DO block to check existence)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_difficulty_lowercase') THEN
        ALTER TABLE quiz.quizzes ADD CONSTRAINT quizzes_difficulty_lowercase 
            CHECK (difficulty = LOWER(difficulty));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_estimated_minutes_positive') THEN
        ALTER TABLE quiz.quizzes ADD CONSTRAINT quizzes_estimated_minutes_positive 
            CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);
    END IF;
END $$;

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '001-quizzes';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'quizzes table created with indexes');
END $$;
