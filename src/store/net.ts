/**
 * Kết nối chơi online qua HTTP + polling (giống Bella Poker): gọi API cùng tên miền (/api/estate),
 * hỏi server đều đặn để nhận state + event mới. Server là nguồn sự thật; event đi vào gameStore nên
 * animation phát giống hệt chơi offline.
 */
import { API_PATH, NET, type DeadlineInfo, type IntentAction, type JoinRequest, type JoinResponse, type RoomView } from '../net/protocol'
import { useGameStore } from './gameStore'
import { useOnlineStore } from './onlineStore'
import { useUiStore } from './uiStore'

const SESSION_KEY = 'bella-estate:online-session'

interface Session {
  code: string
  token: string
}

let session: Session | null = null
/** Số lô event đã nhận (-1 = chưa có ván). */
let since = -1
let pollTimer: ReturnType<typeof setTimeout> | null = null
let polling = false
let failures = 0

function saveSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Không lưu được: chỉ mất khả năng tự vào lại khi tải lại trang.
  }
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (data && typeof data === 'object' && 'code' in data && 'token' in data) {
      const { code, token } = data as Record<string, unknown>
      if (typeof code === 'string' && typeof token === 'string') return { code, token }
    }
  } catch {
    // bỏ qua
  }
  return null
}

class ApiFailure extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function call<T>(body: Record<string, unknown> | null, query?: Record<string, string | number>): Promise<T> {
  const url = query ? `${API_PATH}?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}` : API_PATH
  let response: Response
  try {
    response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined)
  } catch {
    throw new ApiFailure(0, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new ApiFailure(response.status, data.error ?? 'Có lỗi máy chủ.')
  return data as T
}

function applyDeadline(info: DeadlineInfo | null) {
  if (!info) return
  const now = Date.now()
  const endsAt = now + info.remainingMs
  const current = useUiStore.getState().deadline
  // Tránh vẽ lại vòng đồng hồ mỗi lần hỏi: chỉ cập nhật khi đổi người hoặc lệch đáng kể.
  if (current && current.playerId === info.playerId && Math.abs(current.endsAt - endsAt) < 1500) return
  useUiStore.getState().setDeadline({ playerId: info.playerId, startedAt: endsAt - info.totalMs, endsAt })
}

/** Áp câu trả lời của server: sảnh chờ, hoặc state + event của ván. */
function accept(view: RoomView) {
  useOnlineStore.getState().set({ lobby: view.lobby, lobbyAt: Date.now() })
  const game = view.game
  if (!game) {
    if (useOnlineStore.getState().status !== 'lobby') useOnlineStore.getState().set({ status: 'lobby', error: null })
    if (useUiStore.getState().screen !== 'lobby') useUiStore.getState().setScreen('lobby')
    return
  }
  const store = useGameStore.getState()
  if (game.full || store.mode !== 'online' || !store.game) {
    store.loadRemote(game.state, view.lobby.seats, game.you, game.matchId, sendIntent)
    useOnlineStore.getState().set({ status: 'playing', error: null })
    useUiStore.getState().setScreen('game')
  } else if (game.seq !== since) {
    store.applyRemote(game.state, game.events)
  }
  store.updateSeats(view.lobby.seats)
  since = game.seq
  applyDeadline(view.deadline)
}

function schedulePoll() {
  if (pollTimer) clearTimeout(pollTimer)
  if (!session) return
  const inGame = useOnlineStore.getState().status === 'playing'
  const delay = document.hidden ? NET.hiddenPollMs : inGame ? NET.pollMs : NET.lobbyPollMs
  pollTimer = setTimeout(() => void pollOnce(), delay * (failures > 0 ? Math.min(4, failures + 1) : 1))
}

async function pollOnce() {
  if (!session || polling) return schedulePoll()
  polling = true
  const current = session
  try {
    const view = await call<RoomView>(null, { code: current.code, token: current.token, since })
    if (session !== current) return
    failures = 0
    if (useOnlineStore.getState().status === 'reconnecting') useOnlineStore.getState().set({ status: since >= 0 ? 'playing' : 'lobby' })
    accept(view)
  } catch (error) {
    if (session !== current) return
    if (error instanceof ApiFailure && (error.status === 403 || error.status === 404)) {
      // Phòng không còn / đã bị giao cho bot: thoát về màn hình chơi cùng bạn.
      stop()
      useOnlineStore.getState().set({ status: 'error', error: error.message, lobby: null })
      return
    }
    failures++
    useOnlineStore.getState().set({ status: 'reconnecting' })
  } finally {
    polling = false
    schedulePoll()
  }
}

function begin(joined: JoinResponse) {
  session = { code: joined.code, token: joined.token }
  since = -1
  failures = 0
  saveSession(session)
  accept(joined.view)
  schedulePoll()
}

function stop() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
  session = null
  since = -1
  saveSession(null)
}

async function run(label: string, body: Record<string, unknown>) {
  const online = useOnlineStore.getState()
  online.set({ status: 'connecting', error: null, lobby: null, pendingLabel: label })
  try {
    begin(await call<JoinResponse>(body))
  } catch (error) {
    online.set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
  }
}

function sendIntent(action: IntentAction) {
  const current = session
  if (!current) return
  call<RoomView>({ op: 'intent', code: current.code, token: current.token, action, since })
    .then((view) => {
      if (session === current) accept(view)
    })
    .catch((error: unknown) => {
      useGameStore.setState({ awaitingServer: false })
      useUiStore.getState().showBanner(error instanceof Error ? error.message : 'Có lỗi máy chủ.', 'bad', 1.6)
    })
}

export const quickMatch = (opts: JoinRequest) => run('Đang tìm trận…', { op: 'quick', ...opts })
export const createRoom = (opts: JoinRequest & { capacity: number }) => run('Đang tạo phòng…', { op: 'create', ...opts })
export const joinRoom = (code: string, opts: JoinRequest) => run('Đang vào phòng…', { op: 'join', code: code.trim().toUpperCase(), ...opts })

export function startNow() {
  const current = session
  if (!current) return
  call<RoomView>({ op: 'start', code: current.code, token: current.token })
    .then(accept)
    .catch((error: unknown) => useOnlineStore.getState().set({ error: error instanceof Error ? error.message : String(error) }))
}

export async function leaveRoom() {
  const current = session
  stop()
  useOnlineStore.getState().set({ status: 'idle', lobby: null, error: null })
  if (current) await call({ op: 'leave', code: current.code, token: current.token }).catch(() => undefined)
}

/** Vào lại phòng cũ khi tải lại trang (server giữ chỗ 60 giây, trong lúc đó bot chơi thay). */
export async function reconnect(): Promise<boolean> {
  const saved = readSession()
  if (!saved) return false
  session = saved
  since = -1
  useOnlineStore.getState().set({ status: 'reconnecting', error: null })
  await pollOnce()
  return session !== null
}

// Quay lại tab: hỏi server ngay để bắt kịp ván.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && session) void pollOnce()
  })
}
