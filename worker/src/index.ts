import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cleanupExpiredSessions } from './cron'
import { fingerprintMiddleware } from './middleware/fingerprint'
import { apiRoutes } from './routes/api'
import { wsRoute } from './routes/ws'
import type { Bindings, Variables } from './types'

// Re-export Durable Object class — required by CF Workers runtime
export { VoteRoom } from './durable-objects/VoteRoom'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── Global middleware ─────────────────────────────────────────────────────────
// Assign/read client fingerprint cookie for all non-WS requests
app.use('/api/*', fingerprintMiddleware)

// CORS only for API (not needed for same-origin SPA, but useful for dev)
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Admin-Token'],
  credentials: true,
}))

// ── Routes ────────────────────────────────────────────────────────────────────
app.route('/api', apiRoutes)
app.route('/ws', wsRoute)

// ── Fallback: serve SPA ───────────────────────────────────────────────────────
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

// ── Exports ───────────────────────────────────────────────────────────────────
export default {
  fetch: app.fetch,

  // Cron trigger for daily cleanup of expired sessions
  async scheduled (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(cleanupExpiredSessions(env.DB))
  },
}
