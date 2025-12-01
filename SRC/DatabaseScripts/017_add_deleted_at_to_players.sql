-- =============================================
-- Script: 017_add_deleted_at_to_players.sql
-- Description: Add deleted_at column to players table for soft delete
-- Author: System
-- Date: 2025-12-01
-- =============================================

-- Add deleted_at column to players table
ALTER TABLE quiz.players 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Create index on deleted_at for better query performance
CREATE INDEX IF NOT EXISTS idx_players_deleted_at ON quiz.players(deleted_at);

-- Add comment for documentation
COMMENT ON COLUMN quiz.players.deleted_at IS 'Timestamp when player was soft deleted (NULL = active)';

-- Update the view/query logic to use deleted_at instead of is_active
-- Note: Keep is_active column for backward compatibility, but deleted_at is now the primary soft delete mechanism

-- =============================================
-- Verification queries
-- =============================================
-- Check if column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'quiz' 
--   AND table_name = 'players' 
--   AND column_name = 'deleted_at';

-- View active players (deleted_at IS NULL)
-- SELECT COUNT(*) as active_players FROM quiz.players WHERE deleted_at IS NULL;
