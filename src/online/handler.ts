/**
 * API chơi online (một endpoint, giống Bella Poker): không phụ thuộc framework, nhận method + query + body,
 * trả { status, body }. Dùng ở Vercel Function (api/estate.ts) và ở dev server Vite.
 */
import { GameRuleError } from '../game-core'
import { NET, type ApiRequest, type IntentAction, type JoinRequest, type JoinResponse, type RoomView } from '../net/protocol'
import { createRoom, intent, joinRoom, leaveRoom, randomCode, randomToken, requestStart, tick, touch, viewFor, type Rng, type Room } from './room'
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
  return { name: str(body.name, 40), skin: str(body.skin, 40) }
}

export function createApi(store: RoomStore | null, deps: { now: () => number; rng: Rng }) {
  const { now, rng } = deps

  const requireStore = (): RoomStore => {
    if (!store) throw new HttpError(503, 'Chưa cấu hình kho dữ liệu online. Chủ game cần thêm Upstash Redis trên Vercel.')
    return store
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

  async function createAndJoin(mode: 'private' | 'quick', capacity: number, join: JoinRequest): Promise<JoinResponse> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const c = randomCode(rng)
      const t = randomToken(rng)
      const room = createRoom(c, mode, capacity, now())
      joinRoom(room, join, t, now(), rng)
      if (await requireStore().write(roomKey(c), null, JSON.stringify(room), NET.roomTtlSec)) {
        return { code: c, token: t, view: viewFor(room, t, -1, now()) }
      }
    }
    throw new HttpError(500, 'Không tạo được phòng, thử lại nhé.')
  }

  async function joinExisting(c: string, join: JoinRequest): Promise<JoinResponse> {
    const t = randomToken(rng)
    const view = await mutate(c, (room) => {
      tick(room, now(), rng)
      joinRoom(room, join, t, now(), rng)
      return { changed: true, result: viewFor(room, t, -1, now()) }
    })
    return { code: c, token: t, view }
  }

  async function quick(join: JoinRequest): Promise<JoinResponse> {
    const s = requireStore()
    const pointer = await s.read(QUICK_KEY)
    if (pointer) {
      try {
        const joined = await joinExisting(pointer, join)
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
      if (!room.seats.some((s) => s.token === t)) throw new HttpError(403, 'Bạn không còn ở trong phòng này.')
      const changed = tick(room, now(), rng) || touch(room, t, now())
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
        case 'create':
          return { status: 200, body: await createAndJoin('private', Number(body.capacity), joinRequest(body)) }
        case 'quick':
          return { status: 200, body: await quick(joinRequest(body)) }
        case 'join':
          return { status: 200, body: await joinExisting(code(body.code), joinRequest(body)) }
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
          const action = body.action
          if (!action || typeof action !== 'object' || typeof (action as { type?: unknown }).type !== 'string') {
            throw new HttpError(400, 'Ý định không hợp lệ.')
          }
          const since = Number(body.since ?? -1)
          return {
            status: 200,
            body: await mutate(c, (room) => {
              tick(room, now(), rng)
              intent(room, t, action as IntentAction, now(), rng)
              return { changed: true, result: viewFor(room, t, since, now()) }
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
      if (error instanceof HttpError) return { status: error.status, body: { error: error.message } }
      if (error instanceof GameRuleError) return { status: 400, body: { error: error.message } }
      console.error('[estate-api]', error)
      return { status: 500, body: { error: 'Có lỗi máy chủ. Vui lòng thử lại.' } }
    }
  }
}
