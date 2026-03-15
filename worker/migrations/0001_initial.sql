-- Smart Vote D1 Schema
-- Migration: 0001_initial

-- ── Sessions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  type             TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'datetime', 'time')),
  allow_add_options INTEGER NOT NULL DEFAULT 0,
  max_selections   INTEGER DEFAULT NULL,  -- NULL = unlimited (for 'multiple')
  admin_token      TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at       TEXT NOT NULL DEFAULT (datetime('now', '+10 days'))
) STRICT;

-- ── Options ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS options (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  added_by    TEXT DEFAULT NULL,  -- client_fp of who added it (NULL = original)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

-- ── Votes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  option_id   INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  client_fp   TEXT NOT NULL,
  voted_at    TEXT NOT NULL DEFAULT (datetime('now')),
  -- One vote per (client, option) per session — allows multi-option but prevents
  -- double-clicking on same option
  UNIQUE (session_id, option_id, client_fp)
) STRICT;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_options_session     ON options(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_votes_session       ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_client ON votes(session_id, client_fp);
CREATE INDEX IF NOT EXISTS idx_sessions_expires    ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_votes_option        ON votes(option_id);
