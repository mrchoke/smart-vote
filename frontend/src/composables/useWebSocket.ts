import type { WsMessageIn, WsMessageOut } from '@/types'
import { onUnmounted, ref } from 'vue'

type MessageHandler = (msg: WsMessageOut) => void

export function useWebSocket (roomId: string, adminToken?: string) {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)

  let ws: WebSocket | null = null
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false
  const handlers: MessageHandler[] = []

  function buildUrl (): string {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const base = `${proto}//${location.host}/ws/${roomId}`
    const params = new URLSearchParams()
    if (adminToken) params.set('admin_token', adminToken)
    return params.size > 0 ? `${base}?${params}` : base
  }

  function connect () {
    if (destroyed) return
    isConnecting.value = true
    error.value = null

    try {
      ws = new WebSocket(buildUrl())

      ws.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        retryCount = 0
        error.value = null
      }

      ws.onmessage = (event) => {
        try {
          const msg: WsMessageOut = JSON.parse(event.data)
          for (const handler of handlers) handler(msg)
        } catch {
          // ignore corrupt messages
        }
      }

      ws.onclose = (_event) => {
        isConnected.value = false
        isConnecting.value = false
        if (!destroyed) scheduleRetry()
      }

      ws.onerror = () => {
        error.value = 'Connection error'
        isConnecting.value = false
      }
    } catch (e) {
      isConnecting.value = false
      error.value = String(e)
      if (!destroyed) scheduleRetry()
    }
  }

  function scheduleRetry () {
    if (retryCount > 10) {
      error.value = 'Unable to connect after multiple retries'
      return
    }
    const delay = Math.min(1000 * 2 ** retryCount, 30_000)
    retryCount++
    retryTimer = setTimeout(connect, delay)
  }

  function send (msg: WsMessageIn) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  function onMessage (handler: MessageHandler) {
    handlers.push(handler)
    return () => {
      const i = handlers.indexOf(handler)
      if (i !== -1) handlers.splice(i, 1)
    }
  }

  function disconnect () {
    destroyed = true
    if (retryTimer) clearTimeout(retryTimer)
    ws?.close(1000, 'Component unmounted')
    ws = null
  }

  connect()

  onUnmounted(disconnect)

  return { isConnected, isConnecting, error, send, onMessage, disconnect }
}
