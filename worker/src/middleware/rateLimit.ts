/**
 * Rate-limit middleware for Cloudflare Workers.
 *
 * Uses an in-memory Map with a sliding-window counter per client IP.
 * In a single-isolate environment (Workers) this is effective for burst
 * protection.  For distributed multi-region limiting, swap the Map for
 * Cloudflare KV / Durable Objects.
 *
 * Limits:
 *   POST /api/sessions        - 5 creates per IP per hour
 *   POST /api/:id/vote        - 20 votes per IP per minute
 *   all other /api routes     - 120 requests per IP per minute
 */

import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../types'

interface Window {
  count: number
  resetAt: number
}

// In-memory store: "ip:route_key" → Window
const store = new Map<string, Window>()

// Periodically purge expired entries to prevent unbounded growth
function purgeExpired () {
  const now = Date.now()
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key)
  }
}

let lastPurge = Date.now()

function check (key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()

  // Occasional purge
  if (now - lastPurge > 60_000) {
    purgeExpired()
    lastPurge = now
  }

  let win = store.get(key)
  if (!win || win.resetAt <= now) {
    win = { count: 0, resetAt: now + windowMs }
    store.set(key, win)
  }
  win.count++
  const remaining = Math.max(0, limit - win.count)
  return { allowed: win.count <= limit, remaining, resetAt: win.resetAt }
}

function getClientIp (req: Request): string {
  // Cloudflare sets CF-Connecting-IP; fall back to generic headers
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export const rateLimitMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const ip = getClientIp(c.req.raw)
  const path = new URL(c.req.raw.url).pathname
  const method = c.req.raw.method

  let key: string
  let limit: number
  let windowMs: number

  if (method === 'POST' && path === '/api/sessions') {
    // Restrict session creation: 5 per hour per IP
    key = `create:${ip}`
    limit = 5
    windowMs = 60 * 60 * 1000
  } else if (method === 'POST' && /^\/api\/sessions\/[^/]+\/vote$/.test(path)) {
    // Restrict voting: 20 per minute per IP
    key = `vote:${ip}`
    limit = 20
    windowMs = 60 * 1000
  } else {
    // General API: 120 per minute per IP
    key = `api:${ip}`
    limit = 120
    windowMs = 60 * 1000
  }

  const { allowed, remaining, resetAt } = check(key, limit, windowMs)

  if (!allowed) {
    return c.json(
      { error: 'Too many requests. Please try again later.' },
      429,
      {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      }
    )
  }

  await next()

  c.header('X-RateLimit-Limit', String(limit))
  c.header('X-RateLimit-Remaining', String(remaining))
  c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
})
