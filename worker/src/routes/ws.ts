import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

export const wsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * WebSocket upgrade endpoint.
 * Proxies to the VoteRoom Durable Object responsible for this room.
 * Query param `client_fp` (optional) allows passing fingerprint via WS URL
 * instead of cookie (useful for clients that don't send cookies on WS).
 */
wsRoute.get('/:roomId', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 426)
  }

  const roomId = c.req.param('roomId')
  const id = c.env.VOTE_ROOM.idFromName(roomId)
  const stub = c.env.VOTE_ROOM.get(id)

  // Proxy the raw request to the Durable Object
  return stub.fetch(c.req.raw)
})
