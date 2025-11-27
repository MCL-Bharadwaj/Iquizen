-- ============================================================================
-- 009_add_score_percentage.sql
-- Add score_percentage column to attempts table
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('009-add-score-percentage', 'Add score_percentage column to attempts table', '009_add_score_percentage.sql');
END $$;

-- Add score_percentage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'quiz' 
        AND table_name = 'attempts' 
        AND column_name = 'score_percentage'
    ) THEN
        ALTER TABLE quiz.attempts 
        ADD COLUMN score_percentage DECIMAL(5,2) CHECK (score_percentage >= 0 AND score_percentage <= 100);
        
        RAISE NOTICE 'Added score_percentage column to quiz.attempts table';
    ELSE
        RAISE NOTICE 'score_percentage column already exists in quiz.attempts table';
    END IF;
END $$;

-- Update existing records to calculate score_percentage
UPDATE quiz.attempts
SET score_percentage = 
    CASE 
        WHEN max_possible_score > 0 THEN (total_score / max_possible_score) * 100
        ELSE NULL
    END
WHERE status = 'completed' 
  AND total_score IS NOT NULL 
  AND max_possible_score IS NOT NULL
  AND score_percentage IS NULL;

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
    v_updated_count INT;
BEGIN
    SELECT COUNT(*) INTO v_updated_count 
    FROM quiz.attempts 
    WHERE score_percentage IS NOT NULL;
    
    SELECT version_id INTO v_version_id 
    FROM quiz.schema_versions 
    WHERE version_number = '009-add-score-percentage';
    
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 
        'score_percentage column added. Updated ' || v_updated_count || ' existing records');
END $$;
