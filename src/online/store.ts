/**
 * Kho lưu phòng: Upstash Redis (REST) khi có biến môi trường, không thì bộ nhớ của một tiến trình (chạy trên máy).
 * Giống Bella Poker: ghi bằng so-sánh-rồi-ghi (Lua) để hai người bấm cùng lúc không đè lên nhau.
 */
export interface RoomStore {
  mode: 'redis' | 'memory'
  read: (key: string) => Promise<string | null>
  /** Ghi nếu giá trị hiện tại vẫn là `before` (null = chưa có). Trả về false nếu đã bị người khác đổi. */
  write: (key: string, before: string | null, value: string, ttlSec: number) => Promise<boolean>
}

export function memoryStore(): RoomStore {
  const data = new Map<string, { value: string; expires: number }>()
  const get = (key: string) => {
    const entry = data.get(key)
    if (!entry) return null
    if (entry.expires < Date.now()) {
      data.delete(key)
      return null
    }
    return entry.value
  }
  return {
    mode: 'memory',
    read: async (key) => get(key),
    write: async (key, before, value, ttlSec) => {
      if (get(key) !== before) return false
      data.set(key, { value, expires: Date.now() + ttlSec * 1000 })
      return true
    },
  }
}

const CAS_SCRIPT =
  "local cur=redis.call('GET',KEYS[1]); if (ARGV[1]=='__NEW__' and cur==false) or cur==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 else return 0 end"

export function redisStore(url: string, token: string): RoomStore {
  const command = async (args: Array<string | number>): Promise<unknown> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`Redis HTTP ${response.status}`)
    const data = (await response.json()) as { result?: unknown; error?: string }
    if (data.error) throw new Error('Redis error')
    return data.result
  }
  return {
    mode: 'redis',
    read: async (key) => {
      const result = await command(['GET', key])
      return typeof result === 'string' ? result : null
    },
    write: async (key, before, value, ttlSec) =>
      (await command(['EVAL', CAS_SCRIPT, 1, key, before ?? '__NEW__', value, ttlSec])) === 1,
  }
}

/** Kho theo môi trường: có biến Upstash/Vercel KV thì dùng Redis; trên Vercel mà thiếu thì null (báo chưa cấu hình). */
export function storeFromEnv(env: Record<string, string | undefined>): RoomStore | null {
  const found = redisCredentials(env)
  if (found) return redisStore(found.url, found.token)
  return env.VERCEL ? null : memoryStore()
}

/**
 * Tìm thông tin Redis REST trong biến môi trường. Ngoài tên chuẩn, Vercel cho đặt tiền tố riêng khi nối
 * database (vd. `BELLA_KV_REST_API_URL`), nên nhận mọi cặp `<tiền tố>KV_REST_API_URL/TOKEN` hoặc
 * `<tiền tố>REDIS_REST_URL/TOKEN`. Bỏ qua token chỉ đọc (READ_ONLY).
 */
export function redisCredentials(env: Record<string, string | undefined>): { url: string; token: string } | null {
  const pairs: Array<[string, string]> = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ]
  for (const name of Object.keys(env)) {
    if (name.endsWith('KV_REST_API_URL')) pairs.push([name, name.replace(/URL$/, 'TOKEN')])
    if (name.endsWith('REDIS_REST_URL')) pairs.push([name, name.replace(/URL$/, 'TOKEN')])
  }
  for (const [urlName, tokenName] of pairs) {
    const url = env[urlName]
    const token = env[tokenName]
    if (url && token && url.startsWith('https://')) return { url, token }
  }
  return null
}
