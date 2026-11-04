/**
 * Server multiplayer Bella Estate (Colyseus). Chạy: `npm run dev` trong thư mục server/.
 * Cổng: biến môi trường PORT (mặc định 2567).
 */
import { createServer } from 'node:http'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { NET, ROOM_PRIVATE, ROOM_QUICK } from '../../src/net/protocol'
import { BellaRoom } from './BellaRoom'

const port = Number(process.env.PORT) || NET.defaultPort

const httpServer = createServer((req, res) => {
  // Kiểm tra sống (cho dịch vụ host) và cho phép trình duyệt gọi API ghép phòng từ domain khác.
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
  }
})

const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) })
gameServer.define(ROOM_PRIVATE, BellaRoom, { mode: 'private' })
gameServer.define(ROOM_QUICK, BellaRoom, { mode: 'quick' })

await gameServer.listen(port)
console.log(`[bella-estate] server chạy ở ws://localhost:${port}`)
