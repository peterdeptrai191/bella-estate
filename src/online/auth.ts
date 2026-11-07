/**
 * Tài khoản người chơi (tên đăng nhập + mật khẩu), lưu cùng kho với phòng (Upstash Redis / bộ nhớ).
 * - Mật khẩu băm bằng scrypt + muối ngẫu nhiên, so sánh thời gian hằng.
 * - Đăng nhập trả về khóa phiên (ngẫu nhiên 32 ký tự), sống `AUTH.sessionTtlSec`.
 * - Ghế trong phòng gắn với tài khoản (`user:<tên>`), nên đăng nhập ở máy nào cũng vào lại đúng ghế.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { AUTH } from '../net/protocol'
import type { RoomStore } from './store'

export interface UserRecord {
  username: string
  /** Tên hiển thị trong game. */
  name: string
  salt: string
  hash: string
  createdAt: number
}

export interface Account {
  username: string
  name: string
}

export class AuthError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const userKey = (username: string) => `estate:user:${username}`
const sessionKey = (token: string) => `estate:session:${token}`
const roomKey = (username: string) => `estate:user-room:${username}`

/** Tên đăng nhập hợp lệ (chữ thường hoá). */
export function normalizeUsername(value: unknown): string {
  const u = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!new RegExp(`^[a-z0-9_]{${AUTH.usernameMin},${AUTH.usernameMax}}$`).test(u)) {
    throw new AuthError(400, `Tên đăng nhập ${AUTH.usernameMin}–${AUTH.usernameMax} ký tự, chỉ gồm chữ không dấu, số và dấu _`)
  }
  return u
}

function checkPassword(value: unknown): string {
  const p = typeof value === 'string' ? value : ''
  if (p.length < AUTH.passwordMin || p.length > 100) throw new AuthError(400, `Mật khẩu cần ít nhất ${AUTH.passwordMin} ký tự`)
  return p
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString('hex')
}

/** Mã nhận diện ghế của một tài khoản trong phòng. */
export const accountClientId = (username: string) => `user-${username}`

export function createAuth(store: RoomStore, deps: { now: () => number; token: () => string }) {
  async function newSession(user: UserRecord): Promise<{ token: string; account: Account }> {
    const token = deps.token()
    await store.write(sessionKey(token), null, user.username, AUTH.sessionTtlSec)
    return { token, account: { username: user.username, name: user.name } }
  }

  async function readUser(username: string): Promise<UserRecord | null> {
    const raw = await store.read(userKey(username))
    return raw ? (JSON.parse(raw) as UserRecord) : null
  }

  return {
    async register(body: { username?: unknown; password?: unknown; name?: unknown }) {
      const username = normalizeUsername(body.username)
      const password = checkPassword(body.password)
      const name = (typeof body.name === 'string' ? body.name.trim() : '').slice(0, AUTH.nameMax) || username
      const salt = randomBytes(16).toString('hex')
      const user: UserRecord = { username, name, salt, hash: hashPassword(password, salt), createdAt: deps.now() }
      // Ghi kiểu "chỉ khi chưa có": hai người cùng đăng ký một tên thì người sau bị từ chối.
      if (!(await store.write(userKey(username), null, JSON.stringify(user), AUTH.accountTtlSec))) {
        throw new AuthError(409, 'Tên đăng nhập đã có người dùng')
      }
      return newSession(user)
    },

    async login(body: { username?: unknown; password?: unknown }) {
      const username = normalizeUsername(body.username)
      const password = checkPassword(body.password)
      const user = await readUser(username)
      const ok = user !== null && timingSafeEqual(Buffer.from(hashPassword(password, user.salt), 'hex'), Buffer.from(user.hash, 'hex'))
      if (!user || !ok) throw new AuthError(401, 'Sai tên đăng nhập hoặc mật khẩu')
      return newSession(user)
    },

    /** Tài khoản của khóa phiên (null nếu không hợp lệ / hết hạn). */
    async accountOf(token: unknown): Promise<Account | null> {
      if (typeof token !== 'string' || !/^[a-z0-9]{32}$/.test(token)) return null
      const username = await store.read(sessionKey(token))
      if (!username) return null
      const user = await readUser(username)
      return user ? { username: user.username, name: user.name } : null
    },

    async logout(token: unknown) {
      if (typeof token !== 'string' || !/^[a-z0-9]{32}$/.test(token)) return
      const raw = await store.read(sessionKey(token))
      if (raw) await store.write(sessionKey(token), raw, '', 1)
    },

    /** Đổi tên hiển thị. */
    async rename(account: Account, name: unknown): Promise<Account> {
      const next = (typeof name === 'string' ? name.trim() : '').slice(0, AUTH.nameMax)
      if (!next) throw new AuthError(400, 'Tên không được để trống')
      for (let attempt = 0; attempt < 3; attempt++) {
        const raw = await store.read(userKey(account.username))
        if (!raw) throw new AuthError(404, 'Không tìm thấy tài khoản')
        const user = JSON.parse(raw) as UserRecord
        if (await store.write(userKey(account.username), raw, JSON.stringify({ ...user, name: next }), AUTH.accountTtlSec)) {
          return { username: user.username, name: next }
        }
      }
      throw new AuthError(409, 'Thử lại nhé')
    },

    /** Ghi nhớ phòng đang chơi của tài khoản (để hiện nút "Vào lại ván"). */
    async setActiveRoom(username: string, code: string | null) {
      const before = await store.read(roomKey(username))
      await store.write(roomKey(username), before, code ?? '', code ? AUTH.activeRoomTtlSec : 1)
    },

    async activeRoom(username: string): Promise<string | null> {
      return (await store.read(roomKey(username))) || null
    },
  }
}

export type Auth = ReturnType<typeof createAuth>
