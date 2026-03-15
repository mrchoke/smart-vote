// Shared type definitions for D1 tables and API shapes

export type VoteType = 'single' | 'multiple' | 'datetime' | 'time'
export type SessionStatus = 'active' | 'closed'
export type ResultMode = 'show_immediately' | 'after_vote' | 'after_close'

// ── D1 Row Types ──────────────────────────────────────────────────────────────

export interface SessionRow {
  id: string
  title: string
  description: string
  type: VoteType
  allow_add_options: number  // SQLite STRICT uses INTEGER, not boolean
  require_voter_name: number // SQLite STRICT uses INTEGER, not boolean
  show_voter_name: number    // SQLite STRICT uses INTEGER, not boolean
  max_selections: number | null
  admin_token: string
  status: SessionStatus
  result_mode: ResultMode
  created_at: string
  expires_at: string
}

export interface VoterProfileRow {
  client_fp: string
  session_id: string
  voter_name: string
  avatar_id: number
  created_at: string
  updated_at: string
}

export interface OptionRow {
  id: number
  session_id: string
  label: string
  sort_order: number
  added_by: string | null
  created_at: string
}

export interface VoteRow {
  id: number
  session_id: string
  option_id: number
  client_fp: string
  voted_at: string
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface VoterInfo {
  avatar_id: number
  voter_name: string
}

export interface OptionResult {
  id: number
  label: string
  sort_order: number
  added_by: string | null
  created_at: string
  count: number
  voters?: VoterInfo[]
}

export interface SessionPublic {
  id: string
  title: string
  description: string
  type: VoteType
  allow_add_options: boolean
  require_voter_name: boolean
  show_voter_name: boolean
  max_selections: number | null
  status: SessionStatus
  result_mode: ResultMode
  created_at: string
  expires_at: string
  options: OptionResult[]
  total_votes: number
}

export interface CreateSessionBody {
  title: string
  description?: string
  type: VoteType
  allow_add_options?: boolean
  require_voter_name?: boolean
  show_voter_name?: boolean
  max_selections?: number
  result_mode?: ResultMode
  options: string[]  // initial option labels
}

export interface CastVoteBody {
  option_ids: number[]  // supports both single (array of 1) and multiple
}

export interface AddOptionBody {
  label: string
}

// ── WebSocket Message Types ───────────────────────────────────────────────────

export type WsMessageIn =
  | { type: 'subscribe' }
  | { type: 'vote'; option_ids: number[]; client_fp: string; voter_name?: string; avatar_id?: number }
  | { type: 'add_option'; label: string; client_fp: string }
  | { type: 'admin_close'; admin_token: string }
  | { type: 'admin_reopen'; admin_token: string }

export type WsMessageOut =
  | { type: 'init'; session: SessionPublic; voted_option_ids: number[] }
  | { type: 'results_update'; options: OptionResult[]; total_votes: number }
  | { type: 'option_added'; option: OptionResult }
  | { type: 'session_closed' }
  | { type: 'session_reopened' }
  | { type: 'error'; message: string }
  | { type: 'vote_accepted'; option_ids: number[] }
  | { type: 'vote_cast'; avatar_id: number; voter_name: string; option_id: number }

// ── CF Worker Bindings ────────────────────────────────────────────────────────

export interface Bindings {
  DB: D1Database
  VOTE_ROOM: DurableObjectNamespace
  ASSETS: Fetcher
  ADMIN_SECRET?: string
}

// ── Hono Variables (context state) ───────────────────────────────────────────

export interface Variables {
  clientFp: string
}
