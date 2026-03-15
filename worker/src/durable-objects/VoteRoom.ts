import { DurableObject } from 'cloudflare:workers'
import type {
  Bindings,
  OptionResult,
  SessionRow,
  WsMessageIn,
  WsMessageOut,
} from '../types'
import { buildSessionPublic, getOptionsWithCounts } from '../utils'

interface WsAttachment {
  clientFp: string
  isAdmin: boolean
}

export class VoteRoom extends DurableObject<Bindings> {
  /**
   * Handle incoming HTTP requests to this Durable Object.
   * All WebSocket clients for a room connect here.
   * Also caches roomId in durable storage on first connection.
   */
  async fetch (request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 })
    }

    // Extract roomId from URL path and cache it for webSocketMessage handler
    const roomId = url.pathname.split('/').filter(Boolean).pop() ?? ''
    const stored = await this.ctx.storage.get<string>('roomId')
    if (!stored && roomId) {
      await this.ctx.storage.put('roomId', roomId)
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // Derive clientFp: prefer cookie, fall back to URL param or new UUID
    const cookieFp = getCookieValue(request.headers.get('Cookie') ?? '', 'voter_id')
    const paramFp = url.searchParams.get('client_fp')
    const clientFp = cookieFp || paramFp || crypto.randomUUID()

    // Check if this is the admin (token provided via query)
    const adminToken = url.searchParams.get('admin_token')
    let isAdmin = false

    if (adminToken && roomId) {
      const session = await this.env.DB
        .prepare('SELECT admin_token FROM sessions WHERE id = ?')
        .bind(roomId)
        .first<{ admin_token: string }>()
      isAdmin = session?.admin_token === adminToken
    }

    // Accept connection using the Hibernation API
    this.ctx.acceptWebSocket(server)

    // Store per-socket metadata (survives hibernation, max 2KB)
    server.serializeAttachment({ clientFp, isAdmin } satisfies WsAttachment)

    // Send initial session state to the new client
    const session = roomId ? await buildSessionPublic(this.env.DB, roomId) : null
    if (!session) {
      server.close(4004, 'Session not found')
      return new Response(null, { status: 101, webSocket: client })
    }

    // Which options has this client already voted for?
    const votedRows = await this.env.DB
      .prepare('SELECT option_id FROM votes WHERE session_id = ? AND client_fp = ?')
      .bind(roomId, clientFp)
      .all<{ option_id: number }>()
    const votedOptionIds = votedRows.results.map((r) => r.option_id)

    const initMsg: WsMessageOut = { type: 'init', session, voted_option_ids: votedOptionIds }
    server.send(JSON.stringify(initMsg))

    return new Response(null, { status: 101, webSocket: client })
  }

  /**
   * Called by the Hibernation API when a client sends a message.
   */
  async webSocketMessage (ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    let msg: WsMessageIn
    try {
      msg = JSON.parse(typeof rawMessage === 'string' ? rawMessage : new TextDecoder().decode(rawMessage))
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' } satisfies WsMessageOut))
      return
    }

    const attachment = ws.deserializeAttachment() as WsAttachment
    const { clientFp, isAdmin } = attachment

    // Extract roomId from URL (stored in attachment on next call pattern — use ctx storage instead)
    const roomId = await this.ctx.storage.get<string>('roomId')
    if (!roomId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not initialized' } satisfies WsMessageOut))
      return
    }

    switch (msg.type) {
      case 'vote':
        await this.handleVote(ws, roomId, msg.option_ids, msg.client_fp || clientFp, msg.voter_name, msg.avatar_id)
        break
      case 'add_option':
        await this.handleAddOption(ws, roomId, msg.label, msg.client_fp || clientFp, isAdmin)
        break
      case 'admin_close':
        await this.handleAdminClose(ws, roomId, msg.admin_token)
        break
      case 'admin_reopen':
        await this.handleAdminReopen(ws, roomId, msg.admin_token)
        break
    }
  }

  async webSocketClose (ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason)
  }

  async webSocketError (_ws: WebSocket, _error: unknown): Promise<void> {
    // No-op: let hibernation API handle cleanup
  }

  // ── Message Handlers ───────────────────────────────────────────────────────

  private async handleVote (
    ws: WebSocket,
    roomId: string,
    optionIds: number[],
    clientFp: string,
    voterName?: string,
    avatarId?: number,
  ): Promise<void> {
    const db = this.env.DB

    const session = await db
      .prepare('SELECT type, max_selections, status FROM sessions WHERE id = ?')
      .bind(roomId)
      .first<Pick<SessionRow, 'type' | 'max_selections' | 'status'>>()

    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' } satisfies WsMessageOut))
      return
    }
    if (session.status === 'closed') {
      ws.send(JSON.stringify({ type: 'error', message: 'Session is closed' } satisfies WsMessageOut))
      return
    }
    if (session.type === 'single' && optionIds.length > 1) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only one option allowed' } satisfies WsMessageOut))
      return
    }
    if (session.max_selections !== null && optionIds.length > session.max_selections) {
      ws.send(JSON.stringify({ type: 'error', message: `Maximum ${session.max_selections} selections` } satisfies WsMessageOut))
      return
    }

    // Check duplicate vote
    const existing = await db
      .prepare('SELECT id FROM votes WHERE session_id = ? AND client_fp = ? LIMIT 1')
      .bind(roomId, clientFp)
      .first()

    if (existing) {
      ws.send(JSON.stringify({ type: 'error', message: 'Already voted' } satisfies WsMessageOut))
      return
    }

    try {
      const voteInserts = optionIds.map((id) =>
        db.prepare('INSERT INTO votes (session_id, option_id, client_fp) VALUES (?, ?, ?)')
          .bind(roomId, id, clientFp)
      )
      if (avatarId) {
        await db.batch([
          ...voteInserts,
          db.prepare(`INSERT INTO voter_profiles (client_fp, session_id, voter_name, avatar_id)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT (client_fp, session_id) DO UPDATE SET
                        voter_name = excluded.voter_name,
                        avatar_id  = excluded.avatar_id,
                        updated_at = datetime('now')`)
            .bind(clientFp, roomId, voterName?.slice(0, 60) ?? '', avatarId),
        ])
      } else {
        await db.batch(voteInserts)
      }
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Vote failed (duplicate)' } satisfies WsMessageOut))
      return
    }

    ws.send(JSON.stringify({ type: 'vote_accepted', option_ids: optionIds } satisfies WsMessageOut))

    // Broadcast vote notification for floating avatar animation
    this.broadcastAll(JSON.stringify({
      type: 'vote_cast',
      avatar_id: avatarId ?? 1,
      voter_name: voterName ?? '',
      option_id: optionIds[0],
    } satisfies WsMessageOut))

    // Broadcast updated results to all clients
    await this.broadcastResults(roomId)
  }

  private async handleAddOption (
    ws: WebSocket,
    roomId: string,
    label: string,
    clientFp: string,
    isAdmin: boolean,
  ): Promise<void> {
    label = label?.trim()
    if (!label || label.length > 200) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid option label' } satisfies WsMessageOut))
      return
    }

    const db = this.env.DB
    const session = await db
      .prepare('SELECT allow_add_options, status FROM sessions WHERE id = ?')
      .bind(roomId)
      .first<{ allow_add_options: number; status: string }>()

    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' } satisfies WsMessageOut))
      return
    }
    if (session.status === 'closed') {
      ws.send(JSON.stringify({ type: 'error', message: 'Session is closed' } satisfies WsMessageOut))
      return
    }
    if (!isAdmin && !session.allow_add_options) {
      ws.send(JSON.stringify({ type: 'error', message: 'Adding options not allowed' } satisfies WsMessageOut))
      return
    }

    const sortOrderResult = await db
      .prepare('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM options WHERE session_id = ?')
      .bind(roomId)
      .first<{ next: number }>()

    const sortOrder = sortOrderResult?.next ?? 0

    const option = await db
      .prepare('INSERT INTO options (session_id, label, sort_order, added_by) VALUES (?, ?, ?, ?) RETURNING *')
      .bind(roomId, label, sortOrder, isAdmin ? null : clientFp)
      .first<{ id: number; session_id: string; label: string; sort_order: number; added_by: string | null; created_at: string }>()

    if (!option) {
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to add option' } satisfies WsMessageOut))
      return
    }

    const newOption: OptionResult = { ...option, count: 0 }

    // Broadcast new option to all clients
    this.broadcastAll(JSON.stringify({ type: 'option_added', option: newOption } satisfies WsMessageOut))
  }

  private async handleAdminClose (ws: WebSocket, roomId: string, adminToken: string): Promise<void> {
    const valid = await this.validateAdminToken(roomId, adminToken)
    if (!valid) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid admin token' } satisfies WsMessageOut))
      return
    }
    await this.env.DB.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").bind(roomId).run()
    this.broadcastAll(JSON.stringify({ type: 'session_closed' } satisfies WsMessageOut))
  }

  private async handleAdminReopen (ws: WebSocket, roomId: string, adminToken: string): Promise<void> {
    const valid = await this.validateAdminToken(roomId, adminToken)
    if (!valid) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid admin token' } satisfies WsMessageOut))
      return
    }
    await this.env.DB.prepare("UPDATE sessions SET status = 'active' WHERE id = ?").bind(roomId).run()
    this.broadcastAll(JSON.stringify({ type: 'session_reopened' } satisfies WsMessageOut))
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async validateAdminToken (roomId: string, token: string): Promise<boolean> {
    const session = await this.env.DB
      .prepare('SELECT admin_token FROM sessions WHERE id = ?')
      .bind(roomId)
      .first<{ admin_token: string }>()
    return session?.admin_token === token
  }

  private async broadcastResults (roomId: string): Promise<void> {
    const options = await getOptionsWithCounts(this.env.DB, roomId)
    const total = options.reduce((sum, o) => sum + o.count, 0)
    const msg: WsMessageOut = { type: 'results_update', options, total_votes: total }
    this.broadcastAll(JSON.stringify(msg))
  }

  private broadcastAll (message: string): void {
    const sockets = this.ctx.getWebSockets()
    for (const socket of sockets) {
      try {
        socket.send(message)
      } catch {
        // Socket may have closed mid-iteration; ignore
      }
    }
  }

}

function getCookieValue (cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}
