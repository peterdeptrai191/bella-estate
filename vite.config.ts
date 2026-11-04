import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { randomInt } from 'node:crypto'

type ApiHandler = (method: string, query: URLSearchParams, body: unknown) => Promise<{ status: number; body: unknown }>

/**
 * Khi chạy `npm run dev`: phục vụ API chơi online (/api/estate) ngay trong dev server, lưu phòng trong bộ nhớ.
 * Bản deploy dùng Vercel Function api/estate.js (cùng mã ở src/online) + Upstash Redis.
 */
function onlineApiDev(): Plugin {
  let api: ApiHandler | null = null
  return {
    name: 'bella-online-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/estate', async (req, res) => {
        if (!api) {
          const handler = (await server.ssrLoadModule('/src/online/handler.ts')) as { createApi: (store: unknown, deps: unknown) => ApiHandler }
          const store = (await server.ssrLoadModule('/src/online/store.ts')) as { memoryStore: () => unknown }
          api = handler.createApi(store.memoryStore(), { now: () => Date.now(), rng: { int: (max: number) => randomInt(0, max) } })
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        let body: unknown = null
        try {
          body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null
        } catch {
          body = null
        }
        const url = new URL(req.url ?? '/', 'http://local')
        const result = await api(req.method ?? 'GET', url.searchParams, body)
        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(result.body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Đường dẫn tương đối: bản build chạy được ở bất kỳ thư mục/URL nào (không chỉ ở gốc tên miền).
  base: './',
  plugins: [react(), tailwindcss(), onlineApiDev()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
