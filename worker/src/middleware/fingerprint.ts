import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../types'

const COOKIE_NAME = 'voter_id'

export const fingerprintMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  let fp = getCookieValue(c.req.raw.headers.get('cookie') ?? '', COOKIE_NAME)

  if (!fp) {
    fp = crypto.randomUUID()
  }

  c.set('clientFp', fp)

  await next()

  // Set cookie on response (always refresh TTL)
  c.res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${fp}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Strict; Secure`,
  )
})

function getCookieValue (cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}
