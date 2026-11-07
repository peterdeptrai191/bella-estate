/**
 * API chơi online (một endpoint, giống Bella Poker): không phụ thuộc framework, nhận method + query + body,
 * trả { status, body }. Dùng ở Vercel Function (api/estate.ts) và ở dev server Vite.
 */
import { GameRuleError } from '../game-core'
import { NET, type MeResponse, type ApiRequest, type IntentAction, type JoinRequest, type JoinResponse, type RoomView } from '../net/protocol'
import { createRoom, intents, isMember, resumeSeat, joinRoom, leaveRoom, randomCode, randomToken, requestStart, tick, touch, viewFor, type Rng, type Room } from './room'
import { accountClientId, AuthError, createAuth } from './auth'
import type { RoomStore } from './store'

export interface ApiResult {
  status: number
  body: unknown
}

class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const roomKey = (code: string) => `estate:room:${code}`
const QUICK_KEY = 'estate:quick'
const CODE_RE = new RegExp(`^[${NET.codeAlphabet}]{${NET.codeLength}}$`)

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function code(value: unknown): string {
  const c = str(value, 16).trim().toUpperCase()
  if (!CODE_RE.test(c)) throw new HttpError(400, 'Mã phòng không hợp lệ.')
  return c
}

function token(value: unknown): string {
  const t = str(value, 64)
  if (!/^[a-z0-9]{32}$/.test(t)) throw new HttpError(401, 'Phiên chơi không hợp lệ.')
  return t
}

function joinRequest(body: Record<string, unknown>): JoinRequest {
  const clientId = str(body.clientId, 64)
  // Mã "user-…" dành riêng cho tài khoản (server tự gán sau khi xác thực) — trình duyệt không tự khai được.
  const valid = /^[a-zA-Z0-9-]{16,64}$/.test(clientId) && !clientId.startsWith('user-')
  return { name: str(body.name, 40), skin: str(body.skin, 40), ...(valid ? { clientId } : {}) }
}

export function createApi(store: RoomStore | null, deps: { now: () => number; rng: Rng }) {
  const { now, rng } = deps

  const requireStore = (): RoomStore => {
    if (!store) throw new HttpError(503, 'Chưa cấu hình kho dữ liệu online. Chủ game cần thêm Upstash Redis trên Vercel.')
    return store
  }

  const auth = store ? createAuth(store, { now, token: () => randomToken(rng) }) : null
  const requireAuth = () => {
    if (!auth) throw new HttpError(503, 'Chưa cấu hình kho dữ liệu online. Chủ game cần thêm Upstash Redis trên Vercel.')
    return auth
  }

  /** Vào phòng khi đã đăng nhập: ghế gắn với tài khoản (tên hiển thị của tài khoản). */
  async function withAccount(body: Record<string, unknown>): Promise<{ join: JoinRequest; username: string | null }> {
    const join = joinRequest(body)
    const account = auth ? await auth.accountOf(body.auth) : null
    if (!account) return { join, username: null }
    return { join: { ...join, name: account.name, clientId: accountClientId(account.username) }, username: account.username }
  }

  async function remember(username: string | null, joined: JoinResponse): Promise<JoinResponse> {
    if (username && auth) await auth.setActiveRoom(username, joined.code)
    return joined
  }

  const load = async (c: string): Promise<{ raw: string | null; room: Room | null }> => {
    const raw = await requireStore().read(roomKey(c))
    return { raw, room: raw ? (JSON.parse(raw) as Room) : null }
  }

  /** Đọc → sửa → ghi kiểu so-sánh-rồi-ghi, thử lại nếu có người ghi trước. */
  async function mutate<T>(c: string, fn: (room: Room) => { changed: boolean; result: T }): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { raw, room } = await load(c)
      if (!room) throw new HttpError(404, 'Không tìm thấy phòng.')
      const { changed, result } = fn(room)
      if (!changed) return result
      if (await requireStore().write(roomKey(c), raw, JSON.stringify(room), NET.roomTtlSec)) return result
    }
    throw new HttpError(409, 'Phòng đang bận, thử lại nhé.')
  }

  async function createAndJoin(mode: 'private' | 'quick', capacity: number, join: JoinRequest, maxRounds?: number): Promise<JoinResponse> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const c = randomCode(rng)
      const t = randomToken(rng)
      const room = createRoom(c, mode, capacity, now(), maxRounds)
      joinRoom(room, join, t, now(), rng)
      if (await requireStore().write(roomKey(c), null, JSON.stringify(room), NET.roomTtlSec)) {
        return { code: c, token: t, view: viewFor(room, t, -1, now()) }
      }
    }
    throw new HttpError(500, 'Không tạo được phòng, thử lại nhé.')
  }

  async function joinExisting(c: string, join: JoinRequest, allowSpectate: boolean): Promise<JoinResponse> {
    const t = randomToken(rng)
    const view = await mutate(c, (room) => {
      tick(room, now(), rng)
      joinRoom(room, join, t, now(), rng, allowSpectate)
      return { changed: true, result: viewFor(room, t, -1, now()) }
    })
    return { code: c, token: t, view }
  }

  async function quick(join: JoinRequest): Promise<JoinResponse> {
    const s = requireStore()
    const pointer = await s.read(QUICK_KEY)
    if (pointer) {
      try {
        const joined = await joinExisting(pointer, join, false)
        if (joined.view.lobby.started) await s.write(QUICK_KEY, pointer, '', 60)
        return joined
      } catch (error) {
        if (!(error instanceof GameRuleError) && !(error instanceof HttpError)) throw error
        // Phòng chờ cũ đã đầy / đã bắt đầu / hết hạn: mở phòng mới.
      }
    }
    const created = await createAndJoin('quick', NET.maxPlayers, join)
    await s.write(QUICK_KEY, pointer, created.code, NET.quickWaitSec + 30)
    return created
  }

  async function poll(c: string, t: string, since: number): Promise<RoomView> {
    return mutate(c, (room) => {
      if (!isMember(room, t)) throw new HttpError(403, 'Bạn không còn ở trong phòng này.')
      // Ghi nhận "còn ở đây" TRƯỚC khi cho ván chạy (và không bị bỏ qua khi tick có thay đổi),
      // nếu không người đang chơi bị coi là mất kết nối và bot chơi thay lượt của họ.
      const touched = touch(room, t, now())
      const changed = tick(room, now(), rng) || touched
      return { changed, result: viewFor(room, t, since, now()) }
    })
  }

  return async function handle(method: string, query: URLSearchParams, rawBody: unknown): Promise<ApiResult> {
    try {
      if (method === 'GET') {
        if (query.get('op') === 'health') return { status: 200, body: { ok: true, storage: store?.mode ?? 'unconfigured', onlineReady: store !== null } }
        const since = Number(query.get('since') ?? -1)
        return { status: 200, body: await poll(code(query.get('code')), token(query.get('token')), Number.isFinite(since) ? since : -1) }
      }
      if (method !== 'POST') throw new HttpError(405, 'Phương thức không được hỗ trợ.')
      const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown> & Partial<ApiRequest>
      switch (body.op) {
        case 'create': {
          const { join, username } = await withAccount(body)
          return { status: 200, body: await remember(username, await createAndJoin('private', Number(body.capacity), join, Number(body.maxRounds))) }
        }
        case 'quick': {
          const { join, username } = await withAccount(body)
          return { status: 200, body: await remember(username, await quick(join)) }
        }
        case 'join': {
          const { join, username } = await withAccount(body)
          return { status: 200, body: await remember(username, await joinExisting(code(body.code), join, true)) }
        }
        case 'register':
          return { status: 200, body: await requireAuth().register(body) }
        case 'login':
          return { status: 200, body: await requireAuth().login(body) }
        case 'logout':
          await requireAuth().logout(body.auth)
          return { status: 200, body: { ok: true } }
        case 'rename': {
          const account = await requireAuth().accountOf(body.auth)
          if (!account) throw new HttpError(401, 'Phiên đăng nhập đã hết, đăng nhập lại nhé.')
          return { status: 200, body: { account: await requireAuth().rename(account, body.name) } }
        }
        case 'me': {
          const a = requireAuth()
          const account = await a.accountOf(body.auth)
          if (!account) return { status: 200, body: { account: null, activeRoom: null } satisfies MeResponse }
          // Chỉ báo phòng còn tồn tại, còn đang chơi/chờ, và tài khoản còn ghế trong đó.
          let activeRoom = await a.activeRoom(account.username)
          if (activeRoom) {
            const { room } = await load(activeRoom).catch(() => ({ room: null }))
            const mine = room?.seats.some((s) => s.clientId === accountClientId(account.username))
            if (!room || !mine || room.game?.phase === 'finished') {
              await a.setActiveRoom(account.username, null)
              activeRoom = null
            }
          }
          return { status: 200, body: { account, activeRoom } satisfies MeResponse }
        }
        case 'poll':
          return { status: 200, body: await poll(code(body.code), token(body.token), Number(body.since ?? -1)) }
        case 'start': {
          const c = code(body.code)
          const t = token(body.token)
          return {
            status: 200,
            body: await mutate(c, (room) => {
              requestStart(room, t, now(), rng)
              return { changed: true, result: viewFor(room, t, -1, now()) }
            }),
          }
        }
        case 'intent': {
          const c = code(body.code)
          const t = token(body.token)
          // Một lần bấm = danh sách ý định áp theo thứ tự (vẫn nhận `action` lẻ của client cũ).
          const raw = Array.isArray(body.actions) ? (body.actions as unknown[]) : [(body as { action?: unknown }).action]
          const actions = raw.slice(0, NET.maxIntentBatch)
          if (actions.length === 0 || !actions.every((a) => a && typeof a === 'object' && typeof (a as { type?: unknown }).type === 'string')) {
            throw new HttpError(400, 'Ý định không hợp lệ.')
          }
          const since = Number(body.since ?? -1)
          return {
            status: 200,
            body: await mutate(c, (room) => {
              touch(room, t, now(), true)
              tick(room, now(), rng)
              intents(room, t, actions as IntentAction[], now(), rng)
              return { changed: true, result: viewFor(room, t, since, now()) }
            }),
          }
        }
        case 'resume': {
          const c = code(body.code)
          const t = token(body.token)
          return {
            status: 200,
            body: await mutate(c, (room) => {
              resumeSeat(room, t, now())
              tick(room, now(), rng)
              return { changed: true, result: viewFor(room, t, -1, now()) }
            }),
          }
        }
        case 'leave': {
          const c = code(body.code)
          const t = token(body.token)
          await mutate(c, (room) => {
            leaveRoom(room, t)
            return { changed: true, result: null }
          })
          return { status: 200, body: { ok: true } }
        }
        default:
          throw new HttpError(400, 'Yêu cầu không hợp lệ.')
      }
    } catch (error) {
      if (error instanceof HttpError || error instanceof AuthError) return { status: error.status, body: { error: error.message } }
      if (error instanceof GameRuleError) return { status: 400, body: { error: error.message } }
      console.error('[estate-api]', error)
      return { status: 500, body: { error: 'Có lỗi máy chủ. Vui lòng thử lại.' } }
    }
  }
}
