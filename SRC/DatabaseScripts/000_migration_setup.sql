-- ============================================================================
-- Migration Setup Script
-- ============================================================================
-- Purpose: Create schema versioning and migration tracking system
-- Author: Kids Quiz System
-- Date: 2025-11-08
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create quiz schema
CREATE SCHEMA IF NOT EXISTS quiz;

-- Set search path to include quiz
SET search_path TO quiz, public;

-- Schema Versions Table
-- Tracks all applied migrations and their status
CREATE TABLE IF NOT EXISTS quiz.schema_versions (
    version_id SERIAL PRIMARY KEY,
    version_number VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    script_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(255) DEFAULT CURRENT_USER,
    execution_time_ms INT,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'success' -- success, failed, rolled_back
);

-- Migration Log Table
-- Detailed log of all migration operations
CREATE TABLE IF NOT EXISTS quiz.migration_log (
    log_id SERIAL PRIMARY KEY,
    version_id INT REFERENCES quiz.schema_versions(version_id),
    log_level VARCHAR(20), -- INFO, WARN, ERROR
    message TEXT,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Function to log migration events
CREATE OR REPLACE FUNCTION quiz.log_migration(
    p_version_id INT,
    p_level VARCHAR(20),
    p_message TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO quiz.migration_log (version_id, log_level, message)
    VALUES (p_version_id, p_level, p_message);
END;
$$ LANGUAGE plpgsql;

-- Function to register a migration
CREATE OR REPLACE FUNCTION quiz.register_migration(
    p_version VARCHAR(50),
    p_description TEXT,
    p_script_name VARCHAR(255)
) RETURNS INT AS $$
DECLARE
    v_version_id INT;
BEGIN
    INSERT INTO quiz.schema_versions (version_number, description, script_name)
    VALUES (p_version, p_description, p_script_name)
    RETURNING version_id INTO v_version_id;
    
    PERFORM quiz.log_migration(v_version_id, 'INFO', 'Migration started: ' || p_version);
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a migration
CREATE OR REPLACE FUNCTION quiz.complete_migration(
    p_version_id INT,
    p_execution_time_ms INT
) RETURNS VOID AS $$
BEGIN
    UPDATE quiz.schema_versions
    SET execution_time_ms = p_execution_time_ms,
        status = 'success'
    WHERE version_id = p_version_id;
    
    PERFORM quiz.log_migration(p_version_id, 'INFO', 'Migration completed successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to mark migration as failed
CREATE OR REPLACE FUNCTION quiz.fail_migration(
    p_version_id INT,
    p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE quiz.schema_versions
    SET status = 'failed'
    WHERE version_id = p_version_id;
    
    PERFORM quiz.log_migration(p_version_id, 'ERROR', p_error_message);
END;
$$ LANGUAGE plpgsql;

-- Register this migration
SELECT quiz.register_migration('000', 'Migration setup and versioning system', '000_migration_setup.sql');

-- Log successful setup
DO $$
DECLARE
    v_version_id INT;
BEGIN
    SELECT version_id INTO v_version_id FROM quiz.schema_versions WHERE version_number = '000';
    PERFORM quiz.complete_migration(v_version_id, 0);
END $$;

-- Display migration status
SELECT 
    version_number,
    description,
    status,
    applied_at
FROM quiz.schema_versions
ORDER BY version_id;

COMMENT ON SCHEMA quiz IS 'Quiz application schema containing all quiz-related tables';
COMMENT ON TABLE quiz.schema_versions IS 'Tracks all database migrations and their application status';
COMMENT ON TABLE quiz.migration_log IS 'Detailed log of migration operations and events';
