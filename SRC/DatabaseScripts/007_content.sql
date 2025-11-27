-- ============================================================================
-- 006_content.sql
-- Create `content` table for shared, localized content blobs and related indexes
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('006-content', 'Create content table and indexes', '006_content.sql');
END $$;

CREATE TABLE IF NOT EXISTS quiz.content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key TEXT NOT NULL,
    content_type TEXT NOT NULL,
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_content_key_type ON quiz.content(content_key, content_type);
CREATE INDEX IF NOT EXISTS idx_content_translations ON quiz.content USING GIN(translations);
CREATE INDEX IF NOT EXISTS idx_content_metadata ON quiz.content USING GIN(metadata);

-- trigger for updated_at
CREATE OR REPLACE FUNCTION quiz.content_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS trg_content_updated_at ON quiz.content;

CREATE TRIGGER trg_content_updated_at
BEFORE UPDATE ON quiz.content
FOR EACH ROW EXECUTE PROCEDURE content_update_updated_at();

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '006-content';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'content table created with indexes and trigger');
END $$;
