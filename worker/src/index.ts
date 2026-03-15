import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cleanupExpiredSessions } from './cron'
import { fingerprintMiddleware } from './middleware/fingerprint'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { apiRoutes } from './routes/api'
import { wsRoute } from './routes/ws'
import type { Bindings, Variables } from './types'

// Re-export Durable Object class — required by CF Workers runtime
export { VoteRoom } from './durable-objects/VoteRoom'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── Global middleware ─────────────────────────────────────────────────────────
// Assign/read client fingerprint cookie for all non-WS requests
app.use('/api/*', fingerprintMiddleware)

// Rate limiting — protects against API abuse
app.use('/api/*', rateLimitMiddleware)

// CORS: allow the deployed origin plus local dev origins
app.use('/api/*', cors({
  origin: (origin, c) => {
    // Always allow same-origin (no Origin header) or known dev origins
    if (!origin) return origin
    const allowed = [
      'http://localhost:5173',
      'http://localhost:8787',
      // Accept requests from the same worker host (production)
      new URL(c.req.url).origin,
    ]
    return allowed.includes(origin) ? origin : null
  },
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
