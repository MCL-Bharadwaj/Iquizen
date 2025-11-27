-- ============================================================================
-- 007_audit_log.sql
-- Create `audit_log` table to capture important events and system actions
-- ============================================================================

DO $$
DECLARE
    v_version_id INT;
BEGIN
    v_version_id := quiz.register_migration('007-audit-log', 'Create audit_log table and indexes', '007_audit_log.sql');
END $$;

CREATE TABLE IF NOT EXISTS quiz.audit_log (
    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    actor_type TEXT,
    actor_id UUID,
    event_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    payload JSONB,
    created_by_ip INET,
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON quiz.audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON quiz.audit_log(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON quiz.audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON quiz.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_payload ON quiz.audit_log USING GIN(payload);

-- Complete migration
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '007-audit-log';
    PERFORM quiz.complete_migration(v_version_id, 0);
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'audit_log table created with indexes');
END $$;
