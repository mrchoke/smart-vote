-- Migration: 0003_show_voter_name
-- Adds show_voter_name option: when true, display voter names in results instead of just avatars

ALTER TABLE sessions ADD COLUMN show_voter_name INTEGER NOT NULL DEFAULT 0;
