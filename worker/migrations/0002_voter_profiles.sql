-- Migration: 0002_voter_profiles
-- Adds voter name/avatar feature and require_voter_name admin option

-- Add require_voter_name to sessions
ALTER TABLE sessions ADD COLUMN require_voter_name INTEGER NOT NULL DEFAULT 0;

-- Voter profile: one row per (client_fp, session_id)
CREATE TABLE IF NOT EXISTS voter_profiles (
  client_fp   TEXT NOT NULL,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  voter_name  TEXT NOT NULL DEFAULT '',
  avatar_id   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (client_fp, session_id)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_voter_profiles_session ON voter_profiles(session_id);
