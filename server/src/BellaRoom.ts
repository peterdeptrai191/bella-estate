/**
 * Lớp nối Colyseus ↔ MatchSession. Không chứa luật chơi.
 * - Phòng riêng ("private"): mã 6 ký tự làm roomId, ẩn khỏi ghép trận, vào bằng mã.
 * - Ghép nhanh ("quick"): 4 ghế, chờ tối đa 30 giây rồi thêm bot.
 * - Mất kết nối: giữ chỗ 60 giây (bot chơi thay), kết nối lại thì gửi lại toàn bộ state.
 */
import { Room, type Client } from '@colyseus/core'
import { GameRuleError } from '../../src/game-core'
import { NET, type ClientMessages, type JoinOptions } from '../../src/net/protocol'
import { MatchSession, randomCode } from './MatchSession'

interface CreateOptions extends Partial<JoinOptions> {
  mode: 'private' | 'quick'
}

export class BellaRoom extends Room {
  private match!: MatchSession

  onCreate(options: CreateOptions) {
    const mode = options.mode === 'quick' ? 'quick' : 'private'
    const capacity = mode === 'quick' ? NET.maxPlayers : Number(options.capacity) || NET.maxPlayers
    const code = randomCode()
    this.roomId = code
    this.maxClients = capacity
    this.autoDispose = true
    if (mode === 'private') void this.setPrivate(true)
    this.match = new MatchSession({
      mode,
      code,
      capacity,
      send: (sessionId, type, message) => this.clients.getById(sessionId)?.send(type, message),
      onStart: () => void this.lock(),
    })
    void this.setMetadata({ mode, capacity })

    this.onMessage('intent', (client, message: ClientMessages['intent']) => this.guard(client, () => this.match.intent(client.sessionId, message.action)))
    this.onMessage('start', (client) => this.guard(client, () => this.match.requestStart(client.sessionId)))
  }

  private guard(client: Client, fn: () => void) {
    try {
      fn()
    } catch (error) {
      if (error instanceof GameRuleError) client.send('error', { message: error.message })
      else throw error
    }
  }

  onJoin(client: Client, options: JoinOptions) {
    this.match.join(client.sessionId, options)
  }

  async onLeave(client: Client, consented: boolean) {
    this.match.leave(client.sessionId, consented)
    if (consented || !this.match.started) return
    try {
      await this.allowReconnection(client, NET.reconnectSec)
      this.match.reconnect(client.sessionId)
    } catch {
      // Hết 60 giây: giao hẳn ghế cho bot.
      this.match.abandon(client.sessionId)
      if (this.match.connectedHumans === 0) this.disconnect()
    }
  }

  onDispose() {
    this.match.dispose()
  }
}
