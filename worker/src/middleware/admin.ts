import { createFactory } from 'hono/factory'
import type { Bindings, Variables } from '../types'

const factory = createFactory<{ Bindings: Bindings; Variables: Variables }>()

/**
 * Validates the admin token for a specific session.
 * Expects session ID in route param `:id`.
 * Token provided via header `X-Admin-Token` or query param `?token=`.
 */
export const adminAuth = factory.createMiddleware(async (c, next) => {
  const sessionId = c.req.param('id')
  const token =
    c.req.header('X-Admin-Token') ||
    c.req.query('token')

  if (!token) {
    return c.json({ error: 'Missing admin token' }, 401)
  }

  const session = await c.env.DB
    .prepare('SELECT admin_token FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ admin_token: string }>()

  if (!session) {
    return c.json({ error: 'Session not found' }, 404)
  }

  // Timing-safe comparison using SubtleCrypto to prevent timing attacks
  const valid = await timingSafeEqual(token, session.admin_token)
  if (!valid) {
    return c.json({ error: 'Invalid admin token' }, 403)
  }

  await next()
})

async function timingSafeEqual (a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const ka = await crypto.subtle.importKey('raw', enc.encode(a), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const kb = await crypto.subtle.importKey('raw', enc.encode(b), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const dummy = enc.encode('compare')
  const sa = new Uint8Array(await crypto.subtle.sign('HMAC', ka, dummy))
  const sb = new Uint8Array(await crypto.subtle.sign('HMAC', kb, dummy))
  if (sa.length !== sb.length) return false
  let diff = 0
  for (let i = 0; i < sa.length; i++) diff |= sa[i] ^ sb[i]
  return diff === 0
}
