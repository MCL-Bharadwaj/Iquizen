-- ============================================================================
-- 002_questions.sql
-- Create `questions` table, validation functions, constraints and indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('002-questions', 'Create questions table, validation functions, constraints and indexes', '002_questions.sql');
END $$;

-- Ensure update_updated_at function exists
CREATE OR REPLACE FUNCTION quiz.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: questions
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz.questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    age_min INT CHECK (age_min >= 3 AND age_min <= 18),
    age_max INT CHECK (age_max >= 3 AND age_max <= 18),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_seconds INT CHECK (estimated_seconds > 0),
    subject VARCHAR(100),
    locale VARCHAR(10) DEFAULT 'en-US',
    points DECIMAL(10,2) DEFAULT 10.0 CHECK (points >= 0),
    allow_partial_credit BOOLEAN DEFAULT false,
    negative_marking BOOLEAN DEFAULT false,
    supports_read_aloud BOOLEAN DEFAULT true,
    content JSONB NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT age_range_valid_questions CHECK (age_max >= age_min),
    CONSTRAINT question_type_valid CHECK (
        question_type IN (
            'multiple_choice_single',
            'multiple_choice_multi',
            'fill_in_blank',
            'fill_in_blank_drag_drop',
            'ordering',
            'matching',
            'program_submission',
            'short_answer'
        )
    )
);

-- Trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_questions_updated_at
    BEFORE UPDATE ON quiz.questions
    FOR EACH ROW
    EXECUTE FUNCTION quiz.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_type ON quiz.questions(question_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_age_range ON quiz.questions(age_min, age_max) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON quiz.questions(subject, difficulty) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_locale ON quiz.questions(locale) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_question_text ON quiz.questions USING GIN(to_tsvector('english', question_text));
CREATE INDEX IF NOT EXISTS idx_questions_content ON quiz.questions USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_questions_version ON quiz.questions(version);
CREATE INDEX IF NOT EXISTS idx_questions_deleted_at ON quiz.questions(deleted_at);

-- ============================================================================
-- JSONB Validation Functions for question content
-- ============================================================================

CREATE OR REPLACE FUNCTION quiz.validate_mc_single_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'options' AND
        content ? 'correct_answer' AND
        jsonb_typeof(content->'options') = 'array' AND
        jsonb_array_length(content->'options') >= 2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_fill_blank_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'template' AND
        content ? 'blanks' AND
        jsonb_typeof(content->'blanks') = 'array' AND
        jsonb_array_length(content->'blanks') >= 1
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_fill_blank_drag_drop_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'template' AND
        content ? 'blanks' AND
        content ? 'word_bank' AND
        jsonb_typeof(content->'blanks') = 'array' AND
        jsonb_typeof(content->'word_bank') = 'array' AND
        jsonb_array_length(content->'blanks') >= 1 AND
        jsonb_array_length(content->'word_bank') >= jsonb_array_length(content->'blanks')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_ordering_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'items' AND
        content ? 'correct_order' AND
        jsonb_typeof(content->'items') = 'array' AND
        jsonb_typeof(content->'correct_order') = 'array' AND
        jsonb_array_length(content->'items') >= 2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_matching_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'left_items' AND
        content ? 'right_items' AND
        content ? 'correct_pairs' AND
        jsonb_typeof(content->'left_items') = 'array' AND
        jsonb_typeof(content->'right_items') = 'array' AND
        jsonb_typeof(content->'correct_pairs') = 'array' AND
        jsonb_array_length(content->'left_items') >= 2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_program_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'prompt' AND
        content ? 'language' AND
        content ? 'test_cases' AND
        jsonb_typeof(content->'test_cases') = 'array' AND
        jsonb_array_length(content->'test_cases') >= 1
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION quiz.validate_short_answer_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        content ? 'keywords' AND
        jsonb_typeof(content->'keywords') = 'array' AND
        jsonb_array_length(content->'keywords') >= 1
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION quiz.validate_mc_single_content(JSONB) 
    IS 'Validates multiple_choice_single question content structure';

COMMENT ON FUNCTION quiz.validate_fill_blank_content(JSONB)
    IS 'Validates fill_in_blank question content structure';

COMMENT ON FUNCTION quiz.validate_fill_blank_drag_drop_content(JSONB)
    IS 'Validates fill_in_blank_drag_drop question content structure';

COMMENT ON FUNCTION quiz.validate_ordering_content(JSONB)
    IS 'Validates ordering question content structure';

COMMENT ON FUNCTION quiz.validate_matching_content(JSONB)
    IS 'Validates matching question content structure';

COMMENT ON FUNCTION quiz.validate_program_content(JSONB)
    IS 'Validizes program_submission question content structure';

COMMENT ON FUNCTION quiz.validate_short_answer_content(JSONB)
    IS 'Validates short_answer question content structure';

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '002-questions';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'questions table and validation functions created');
END $$;
