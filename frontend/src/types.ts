export type VoteType = 'single' | 'multiple' | 'datetime' | 'time'
export type SessionStatus = 'active' | 'closed'

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
  created_at: string
  expires_at: string
  options: OptionResult[]
  total_votes: number
}

export interface VoterProfile {
  voter_name: string
  avatar_id: number
}

export type WsMessageOut =
  | { type: 'init'; session: SessionPublic; voted_option_ids: number[] }
  | { type: 'results_update'; options: OptionResult[]; total_votes: number }
  | { type: 'option_added'; option: OptionResult }
  | { type: 'session_closed' }
  | { type: 'session_reopened' }
  | { type: 'error'; message: string }
  | { type: 'vote_accepted'; option_ids: number[] }
  | { type: 'vote_cast'; avatar_id: number; voter_name: string; option_id: number }

export type WsMessageIn =
  | { type: 'subscribe' }
  | { type: 'vote'; option_ids: number[]; client_fp?: string; voter_name?: string; avatar_id?: number }
  | { type: 'add_option'; label: string; client_fp?: string }
  | { type: 'admin_close'; admin_token: string }
  | { type: 'admin_reopen'; admin_token: string }
