import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { adminAuth } from '../middleware/admin'
import type { Bindings, OptionResult, Variables } from '../types'
import { buildSessionPublic, generateId, getOptionsWithCounts } from '../utils'

export const apiRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── Create session ─────────────────────────────────────────────────────────────
apiRoutes.post(
  '/sessions',
  zValidator('json', z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(''),
    type: z.enum(['single', 'multiple', 'datetime', 'time']),
    allow_add_options: z.boolean().optional().default(false),
    require_voter_name: z.boolean().optional().default(false),
    show_voter_name: z.boolean().optional().default(false),
    max_selections: z.number().int().min(2).optional(),
    options: z.array(z.string().min(1).max(200)).min(2).max(50),
  })),
  async (c) => {
    const body = c.req.valid('json')
    const id = generateId()
    const adminToken = crypto.randomUUID()
    const db = c.env.DB

    await db.batch([
      db.prepare(
        `INSERT INTO sessions (id, title, description, type, allow_add_options, require_voter_name, show_voter_name, max_selections, admin_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, body.title, body.description, body.type, body.allow_add_options ? 1 : 0, body.require_voter_name ? 1 : 0, body.show_voter_name ? 1 : 0, body.max_selections ?? null, adminToken),
      ...body.options.map((label, i) =>
        db.prepare('INSERT INTO options (session_id, label, sort_order) VALUES (?, ?, ?)')
          .bind(id, label, i)
      ),
    ])

    const session = await buildSessionPublic(db, id)

    return c.json({
      session,
      adminToken,
      shareUrl: `/vote/${id}`,
      adminUrl: `/admin/${id}?token=${adminToken}`,
    }, 201)
  }
)

// ── Get session ────────────────────────────────────────────────────────────────
apiRoutes.get('/sessions/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const clientFp = c.get('clientFp')

  const session = await buildSessionPublic(db, id)
  if (!session) return c.json({ error: 'Session not found' }, 404)

  // Return which options this client has already voted for
  const votedRows = await db
    .prepare('SELECT option_id FROM votes WHERE session_id = ? AND client_fp = ?')
    .bind(id, clientFp)
    .all<{ option_id: number }>()

  const votedOptionIds = votedRows.results.map((r) => r.option_id)

  return c.json({ session, votedOptionIds })
})

// ── Update session (admin) ─────────────────────────────────────────────────────
apiRoutes.put(
  '/sessions/:id',
  adminAuth,
  zValidator('json', z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    allow_add_options: z.boolean().optional(),
    require_voter_name: z.boolean().optional(),
    show_voter_name: z.boolean().optional(),
    max_selections: z.number().int().min(2).nullable().optional(),
  })),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const db = c.env.DB

    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title) }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description) }
    if (body.allow_add_options !== undefined) { updates.push('allow_add_options = ?'); values.push(body.allow_add_options ? 1 : 0) }
    if (body.require_voter_name !== undefined) { updates.push('require_voter_name = ?'); values.push(body.require_voter_name ? 1 : 0) }
    if (body.show_voter_name !== undefined) { updates.push('show_voter_name = ?'); values.push(body.show_voter_name ? 1 : 0) }
    if (body.max_selections !== undefined) { updates.push('max_selections = ?'); values.push(body.max_selections) }

    if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

    values.push(id)
    await db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

    const session = await buildSessionPublic(db, id)
    return c.json({ session })
  }
)

// ── Close session (admin) ──────────────────────────────────────────────────────
apiRoutes.post('/sessions/:id/close', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").bind(id).run()
  return c.json({ ok: true })
})

// ── Reopen session (admin) ─────────────────────────────────────────────────────
apiRoutes.post('/sessions/:id/reopen', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare("UPDATE sessions SET status = 'active' WHERE id = ?").bind(id).run()
  return c.json({ ok: true })
})

// ── Delete session (admin) ─────────────────────────────────────────────────────
apiRoutes.delete('/sessions/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Add option ─────────────────────────────────────────────────────────────────
apiRoutes.post(
  '/sessions/:id/options',
  zValidator('json', z.object({ label: z.string().min(1).max(200) })),
  async (c) => {
    const id = c.req.param('id')
    const { label } = c.req.valid('json')
    const db = c.env.DB
    const clientFp = c.get('clientFp')

    // Check token for admin — non-fatal if missing
    const adminToken = c.req.header('X-Admin-Token') || c.req.query('token')
    const session = await db
      .prepare('SELECT allow_add_options, admin_token, status FROM sessions WHERE id = ?')
      .bind(id)
      .first<{ allow_add_options: number; admin_token: string; status: string }>()

    if (!session) return c.json({ error: 'Session not found' }, 404)
    if (session.status === 'closed') return c.json({ error: 'Session is closed' }, 400)

    const isAdmin = adminToken === session.admin_token
    if (!isAdmin && !session.allow_add_options) {
      return c.json({ error: 'Adding options is not allowed for this session' }, 403)
    }

    const sortOrderResult = await db
      .prepare('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM options WHERE session_id = ?')
      .bind(id)
      .first<{ next: number }>()

    const sortOrder = sortOrderResult?.next ?? 0

    const result = await db
      .prepare('INSERT INTO options (session_id, label, sort_order, added_by) VALUES (?, ?, ?, ?) RETURNING *')
      .bind(id, label, sortOrder, isAdmin ? null : clientFp)
      .first<{ id: number; session_id: string; label: string; sort_order: number; added_by: string | null; created_at: string }>()

    if (!result) return c.json({ error: 'Failed to add option' }, 500)

    const option: OptionResult = { ...result, count: 0 }
    return c.json({ option }, 201)
  }
)

// ── Cast vote ──────────────────────────────────────────────────────────────────
apiRoutes.post(
  '/sessions/:id/vote',
  zValidator('json', z.object({
    option_ids: z.array(z.number().int().positive()).min(1).max(50),
  })),
  async (c) => {
    const id = c.req.param('id')
    const { option_ids } = c.req.valid('json')
    const db = c.env.DB
    const clientFp = c.get('clientFp')

    const session = await db
      .prepare('SELECT type, max_selections, status FROM sessions WHERE id = ?')
      .bind(id)
      .first<{ type: string; max_selections: number | null; status: string }>()

    if (!session) return c.json({ error: 'Session not found' }, 404)
    if (session.status === 'closed') return c.json({ error: 'Session is closed' }, 400)

    // Validate selection count
    if (session.type === 'single' && option_ids.length > 1) {
      return c.json({ error: 'Only one option allowed for single choice' }, 400)
    }
    if (session.max_selections !== null && option_ids.length > session.max_selections) {
      return c.json({ error: `Maximum ${session.max_selections} selections allowed` }, 400)
    }

    // Check if client already voted in this session
    const existingVote = await db
      .prepare('SELECT id FROM votes WHERE session_id = ? AND client_fp = ? LIMIT 1')
      .bind(id, clientFp)
      .first<{ id: number }>()

    if (existingVote) {
      return c.json({ error: 'You have already voted in this session' }, 409)
    }

    // Insert votes in batch
    try {
      await db.batch(
        option_ids.map((optId) =>
          db.prepare('INSERT INTO votes (session_id, option_id, client_fp) VALUES (?, ?, ?)')
            .bind(id, optId, clientFp)
        )
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('UNIQUE')) {
        return c.json({ error: 'You have already voted for one of these options' }, 409)
      }
      throw e
    }

    return c.json({ ok: true, option_ids })
  }
)

// ── Get results ────────────────────────────────────────────────────────────────
apiRoutes.get('/sessions/:id/results', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB

  const session = await db
    .prepare('SELECT id FROM sessions WHERE id = ?')
    .bind(id)
    .first<{ id: string }>()

  if (!session) return c.json({ error: 'Session not found' }, 404)

  const options = await getOptionsWithCounts(db, id)
  const total = options.reduce((sum, o) => sum + o.count, 0)

  return c.json({ options, total_votes: total })
})

// ── Save voter profile ─────────────────────────────────────────────────────────
apiRoutes.put(
  '/sessions/:id/voter-profile',
  zValidator('json', z.object({
    voter_name: z.string().min(1).max(60),
    avatar_id: z.number().int().min(1).max(20),
  })),
  async (c) => {
    const id = c.req.param('id')
    const db = c.env.DB
    const clientFp = c.get('clientFp')
    const { voter_name, avatar_id } = c.req.valid('json')

    const session = await db
      .prepare('SELECT id FROM sessions WHERE id = ?')
      .bind(id)
      .first<{ id: string }>()
    if (!session) return c.json({ error: 'Session not found' }, 404)

    await db
      .prepare(`INSERT INTO voter_profiles (client_fp, session_id, voter_name, avatar_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (client_fp, session_id) DO UPDATE SET
                  voter_name = excluded.voter_name,
                  avatar_id  = excluded.avatar_id,
                  updated_at = datetime('now')`)
      .bind(clientFp, id, voter_name, avatar_id)
      .run()

    return c.json({ ok: true })
  }
)

// ── Get voter profile ──────────────────────────────────────────────────────────
apiRoutes.get('/sessions/:id/voter-profile', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const clientFp = c.get('clientFp')

  const profile = await db
    .prepare('SELECT voter_name, avatar_id FROM voter_profiles WHERE client_fp = ? AND session_id = ?')
    .bind(clientFp, id)
    .first<{ voter_name: string; avatar_id: number }>()

  return c.json({ profile: profile ?? null })
})
