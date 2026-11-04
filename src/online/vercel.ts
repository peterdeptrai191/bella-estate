/**
 * Vercel Function cho chơi online. Được bundle thành api/estate.js bằng `npm run build:api`
 * (một file JS duy nhất, tránh lỗi import ESM không đuôi trên Vercel). Đừng sửa api/estate.js bằng tay.
 */
import { randomInt } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApi } from './handler'
import { storeFromEnv } from './store'

const api = createApi(storeFromEnv(process.env), {
  now: () => Date.now(),
  rng: { int: (max) => randomInt(0, max) },
})

type VercelRequest = IncomingMessage & { body?: unknown }

export default async function handler(req: VercelRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = body.length > 8192 ? null : JSON.parse(body)
    } catch {
      body = null
    }
  }
  const url = new URL(req.url ?? '/', 'http://local')
  const result = await api(req.method ?? 'GET', url.searchParams, body)
  res.statusCode = result.status
  res.end(JSON.stringify(result.body))
}
