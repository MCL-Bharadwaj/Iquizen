-- =============================================
-- Script: 016_players.sql
-- Description: Create players table in quiz schema
-- Author: System
-- Date: 2025-11-26
-- =============================================

-- Drop table if exists (for development/testing)
-- DROP TABLE IF EXISTS quiz.players CASCADE;

-- =============================================
-- Create players table
-- =============================================
CREATE TABLE IF NOT EXISTS quiz.players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES quiz.users(user_id) ON DELETE CASCADE,
    player_number VARCHAR(50) NOT NULL UNIQUE,
    enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    graduation_date TIMESTAMP,
    total_score INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uk_players_user_id UNIQUE(user_id),
    CONSTRAINT chk_players_total_score CHECK (total_score >= 0),
    CONSTRAINT chk_players_games_played CHECK (games_played >= 0)
);

-- =============================================
-- Create indexes for better query performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_players_user_id ON quiz.players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_player_number ON quiz.players(player_number);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON quiz.players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_total_score ON quiz.players(total_score DESC);

-- =============================================
-- Add comments for documentation
-- =============================================
COMMENT ON TABLE quiz.players IS 'Stores player-specific information for quiz game participants';
COMMENT ON COLUMN quiz.players.player_id IS 'Unique identifier for the player';
COMMENT ON COLUMN quiz.players.user_id IS 'Reference to the user account';
COMMENT ON COLUMN quiz.players.player_number IS 'Unique player number for identification';
COMMENT ON COLUMN quiz.players.enrollment_date IS 'When the player enrolled/joined';
COMMENT ON COLUMN quiz.players.graduation_date IS 'When the player graduated/completed (optional)';
COMMENT ON COLUMN quiz.players.total_score IS 'Cumulative score across all games';
COMMENT ON COLUMN quiz.players.games_played IS 'Total number of games/quizzes completed';
COMMENT ON COLUMN quiz.players.is_active IS 'Whether the player account is currently active';

-- =============================================
-- Create trigger for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION quiz.update_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_players_updated_at ON quiz.players;
CREATE TRIGGER trg_players_updated_at
    BEFORE UPDATE ON quiz.players
    FOR EACH ROW
    EXECUTE FUNCTION quiz.update_players_updated_at();

-- =============================================
-- Insert sample data (optional - for testing)
-- =============================================
-- Uncomment below to insert sample players
/*
INSERT INTO quiz.players (user_id, player_number, enrollment_date, total_score, games_played)
SELECT 
    user_id,
    'PLR-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0'),
    created_at,
    0,
    0
FROM quiz.users
WHERE role = 'player'
ON CONFLICT (user_id) DO NOTHING;
*/

-- =============================================
-- Verification queries
-- =============================================
-- SELECT * FROM quiz.players ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) as total_players FROM quiz.players WHERE is_active = true;
