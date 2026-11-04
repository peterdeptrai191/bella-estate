/**
 * Kết nối server multiplayer (Colyseus). Server là nguồn sự thật: client gửi ý định,
 * nhận state + event và đẩy vào gameStore (animation phát như chơi offline).
 */
import { Client, type Room } from 'colyseus.js'
import { NET, ROOM_PRIVATE, ROOM_QUICK, type DeadlineInfo, type JoinOptions, type ServerMessages } from '../net/protocol'
import { useGameStore } from './gameStore'
import { useOnlineStore } from './onlineStore'
import { useUiStore } from './uiStore'

const TOKEN_KEY = 'bella-estate:reconnect'

/** Địa chỉ server: biến môi trường VITE_SERVER_URL, hoặc cổng mặc định trên máy đang chạy (khi dev). */
export function serverUrl(): string | null {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined
  if (configured) return configured
  const { hostname, protocol } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\./.test(hostname)) {
    return `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}:${NET.defaultPort}`
  }
  return null
}

let room: Room | null = null

function saveToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Không lưu được: chỉ mất khả năng tự vào lại khi tải lại trang.
  }
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function applyDeadline(info: DeadlineInfo | null) {
  if (!info) return
  const now = Date.now()
  useUiStore.getState().setDeadline({ playerId: info.playerId, startedAt: now + info.remainingMs - info.totalMs, endsAt: now + info.remainingMs })
}

function attach(r: Room) {
  room = r
  saveToken(r.reconnectionToken)
  const online = useOnlineStore.getState()
  online.set({ status: 'lobby', error: null })
  const send = (action: unknown) => r.send('intent', { action })

  r.onMessage('lobby', (lobby: ServerMessages['lobby']) => {
    useOnlineStore.getState().set({ lobby, lobbyAt: Date.now() })
    if (lobby.started) useGameStore.getState().updateSeats(lobby.seats)
  })
  r.onMessage('sync', (m: ServerMessages['sync']) => {
    useGameStore.getState().loadRemote(m.state, m.seats, m.you, m.matchId, send)
    applyDeadline(m.deadline)
    useOnlineStore.getState().set({ status: 'playing' })
    useUiStore.getState().setScreen('game')
  })
  r.onMessage('events', (m: ServerMessages['events']) => {
    useGameStore.getState().applyRemote(m.state, m.events)
    applyDeadline(m.deadline)
  })
  r.onMessage('deadline', (m: ServerMessages['deadline']) => applyDeadline(m))
  r.onMessage('error', (m: ServerMessages['error']) => {
    useGameStore.setState({ awaitingServer: false })
    useUiStore.getState().showBanner(m.message, 'bad', 1.6)
  })
  r.onLeave((code) => {
    if (room !== r) return
    room = null
    // 1000/4000 = tự rời. Mã khác: mất kết nối → thử vào lại bằng token (server giữ chỗ 60 giây).
    if (code === 1000 || code === 4000) return
    useOnlineStore.getState().set({ status: 'reconnecting' })
    void reconnect()
  })
}

async function run(label: string, fn: (client: Client) => Promise<Room>) {
  const url = serverUrl()
  const online = useOnlineStore.getState()
  if (!url) {
    online.set({ status: 'error', error: 'Chưa cấu hình máy chủ chơi online (VITE_SERVER_URL).' })
    return
  }
  online.set({ status: 'connecting', error: null, lobby: null, pendingLabel: label })
  try {
    attach(await fn(new Client(url)))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    online.set({
      status: 'error',
      error: /not found|invalid|locked|full/i.test(message)
        ? 'Không tìm thấy phòng, phòng đã đủ người hoặc đã bắt đầu.'
        : `Không kết nối được máy chủ (${url}).`,
    })
  }
}

export const quickMatch = (opts: JoinOptions) => run('Đang tìm trận…', (c) => c.joinOrCreate(ROOM_QUICK, opts))
export const createRoom = (opts: JoinOptions) => run('Đang tạo phòng…', (c) => c.create(ROOM_PRIVATE, opts))
export const joinRoom = (code: string, opts: JoinOptions) =>
  run('Đang vào phòng…', (c) => c.joinById(code.trim().toUpperCase(), opts))

export function startNow() {
  room?.send('start', {})
}

export async function leaveRoom() {
  const r = room
  room = null
  saveToken(null)
  useOnlineStore.getState().set({ status: 'idle', lobby: null, error: null })
  if (r) await r.leave(true).catch(() => undefined)
}

/** Vào lại phòng cũ (mất mạng, hoặc tải lại trang trong lúc đang chơi). */
export async function reconnect(): Promise<boolean> {
  const token = readToken()
  const url = serverUrl()
  if (!token || !url) return false
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      attach(await new Client(url).reconnect(token))
      return true
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  saveToken(null)
  useOnlineStore.getState().set({ status: 'error', error: 'Mất kết nối với phòng chơi.' })
  return false
}
