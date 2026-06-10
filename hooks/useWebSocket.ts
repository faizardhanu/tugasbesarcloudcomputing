import { useEffect, useRef } from 'react'
import { API_BASE_URL } from '@/lib/api'

/**
 * Builds the WebSocket URL from the REST API base URL.
 * e.g. "http://localhost:5000/api" → "ws://localhost:5000/ws"
 */
function buildWsUrl(): string {
  const apiUrl = new URL(API_BASE_URL)
  const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const port = apiUrl.port ? `:${apiUrl.port}` : ''
  return `${wsProtocol}//${apiUrl.hostname}${port}/ws`
}

interface UseWebSocketOptions {
  /** Only connect when this is true (e.g. isAuthenticated) */
  enabled?: boolean
  /** Called every time a message arrives whose type matches one of these strings */
  onMessage: (type: string) => void
  /** Types to listen for. If empty, all messages are forwarded. */
  types?: string[]
}

const INITIAL_RECONNECT_DELAY_MS = 2000
const MAX_RECONNECT_DELAY_MS = 30000

/**
 * Manages a WebSocket connection with:
 * - Silent onerror (no noisy console spam when server is not ready)
 * - Exponential-backoff auto-reconnect
 * - Clean teardown on unmount / when `enabled` turns false
 */
export function useWebSocket({ enabled = true, onMessage, types = [] }: UseWebSocketOptions) {
  const onMessageRef = useRef(onMessage)
  const typesRef = useRef(types)

  // Keep refs up to date so the effect closure always calls the latest callbacks
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { typesRef.current = types }, [types])

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS
    let destroyed = false

    function connect() {
      if (destroyed) return

      try {
        ws = new WebSocket(buildWsUrl())
      } catch {
        // URL construction failed – retry after delay
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        // Reset backoff on successful connection
        reconnectDelay = INITIAL_RECONNECT_DELAY_MS
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string }
          if (!data?.type) return

          const wantedTypes = typesRef.current
          if (wantedTypes.length === 0 || wantedTypes.includes(data.type)) {
            onMessageRef.current(data.type)
          }
        } catch {
          // Silently ignore malformed messages
        }
      }

      ws.onerror = () => {
        // Silently ignore – onerror is always followed by onclose, which
        // handles the reconnect.  We intentionally do NOT log here to avoid
        // noisy console spam when the backend is not yet ready.
      }

      ws.onclose = () => {
        ws = null
        scheduleReconnect()
      }
    }

    function scheduleReconnect() {
      if (destroyed) return
      reconnectTimeoutId = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
        connect()
      }, reconnectDelay)
    }

    connect()

    return () => {
      destroyed = true
      if (reconnectTimeoutId !== null) clearTimeout(reconnectTimeoutId)
      if (ws) {
        ws.onclose = null  // prevent reconnect on intentional close
        ws.close()
        ws = null
      }
    }
  }, [enabled])
}
