-- Migration: 0004_result_mode
-- Adds result_mode to sessions to control when voters can see results
--   show_immediately  — results visible to everyone at all times (default)
--   after_vote        — results visible only after the viewer has cast a vote (or session is closed)
--   after_close       — results visible only after admin closes the session

ALTER TABLE sessions ADD COLUMN result_mode TEXT NOT NULL DEFAULT 'show_immediately';
