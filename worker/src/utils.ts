import type { OptionResult, SessionPublic, SessionRow } from './types'

/**
 * Generates a random 16-char URL-safe ID.
 */
export function generateId (): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Fetches all options for a session with their vote counts.
 */
export async function getOptionsWithCounts (db: D1Database, sessionId: string): Promise<OptionResult[]> {
  const rows = await db
    .prepare(`
      SELECT o.id, o.label, o.sort_order, o.added_by, o.created_at,
             COUNT(DISTINCT v.id) AS count,
             json_group_array(
               json_object('avatar_id', vp.avatar_id, 'voter_name', COALESCE(vp.voter_name, ''))
             ) FILTER (WHERE vp.client_fp IS NOT NULL) AS voters_json
      FROM options o
      LEFT JOIN votes v ON v.option_id = o.id AND v.session_id = o.session_id
      LEFT JOIN voter_profiles vp ON vp.client_fp = v.client_fp AND vp.session_id = o.session_id
      WHERE o.session_id = ?
      GROUP BY o.id
      ORDER BY o.sort_order ASC
    `)
    .bind(sessionId)
    .all<OptionResult & { voters_json?: string | null }>()

  return rows.results.map(({ voters_json, ...opt }) => ({
    ...opt,
    voters: voters_json ? JSON.parse(voters_json) as { avatar_id: number; voter_name: string }[] : [],
  }))
}

/**
 * Fetches a session with its options and vote counts from D1.
 * Returns null if session doesn't exist.
 */
export async function buildSessionPublic (
  db: D1Database,
  sessionId: string,
): Promise<SessionPublic | null> {
  const session = await db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<SessionRow>()

  if (!session) return null

  const options = await getOptionsWithCounts(db, sessionId)
  const total = options.reduce((sum, o) => sum + o.count, 0)

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    type: session.type,
    allow_add_options: session.allow_add_options === 1,
    require_voter_name: session.require_voter_name === 1,
    show_voter_name: session.show_voter_name === 1,
    max_selections: session.max_selections,
    status: session.status,
    result_mode: session.result_mode ?? 'show_immediately',
    created_at: session.created_at,
    expires_at: session.expires_at,
    options,
    total_votes: total,
  }
}
