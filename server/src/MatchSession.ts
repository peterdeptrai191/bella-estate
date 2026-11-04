/**
 * Một ván online, server-authoritative. Không phụ thuộc Colyseus (BellaRoom chỉ là lớp nối),
 * nên test được bằng đồng hồ giả.
 *
 * - Client chỉ gửi ý định; server gán ghế, kiểm tra bằng game-core (`applyAction`) rồi phát event.
 * - Xúc xắc/thẻ tung trên server: trước mỗi action, trạng thái RNG được thay bằng số ngẫu nhiên thật của
 *   server, và state gửi cho client không kèm trạng thái RNG (client không đoán trước được kết quả).
 * - Bot (ghế bot, hoặc người đang mất kết nối) và hết giờ lượt đều do server tự hành động.
 */
import { randomInt } from 'node:crypto'
import { ECONOMY } from '../../src/config/economy'
import {
  applyAction,
  autoAction,
  createGame,
  currentPlayer,
  getTimeoutAction,
  GameRuleError,
  type GameAction,
  type GameEvent,
  type GameState,
  type PlayerId,
} from '../../src/game-core'
import { NET, type DeadlineInfo, type IntentAction, type JoinOptions, type LobbyInfo, type SeatInfo, type ServerMessages } from '../../src/net/protocol'
import { VISUAL } from '../../src/config/visual'
import { SEAT_SKINS, skinById, META } from '../../src/config/skins'
import { animationMs } from './pacing'

export interface Clock {
  now(): number
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

export const realClock: Clock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
}

export type Send = <K extends keyof ServerMessages>(sessionId: string, type: K, message: ServerMessages[K]) => void

interface Seat {
  sessionId: string | null
  name: string
  skin: string
  kind: 'human' | 'bot'
  connected: boolean
  playerId: PlayerId | null
}

const BOT_NAMES = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Khang', 'Vy']

export interface MatchOptions {
  mode: 'private' | 'quick'
  code: string
  capacity: number
  clock?: Clock
  send: Send
  /** Gọi khi ván bắt đầu (để phòng tự khóa). */
  onStart?: () => void
  /** Seed cố định cho test; mặc định ngẫu nhiên. */
  seed?: number
  /** RNG cho xúc xắc; mặc định crypto. */
  random?: () => number
}

export class MatchSession {
  readonly mode: 'private' | 'quick'
  readonly code: string
  capacity: number
  seats: Seat[] = []
  game: GameState | null = null
  matchId = ''
  private clock: Clock
  private send: Send
  private timer: unknown = null
  private quickTimer: unknown = null
  private quickEndsAt: number | null = null
  /** Client còn đang phát animation tới thời điểm này. */
  private busyUntil = 0
  private deadline: { playerId: PlayerId; startedAt: number; endsAt: number } | null = null
  private readonly random: () => number
  private readonly seed: number | undefined
  private readonly onStart?: () => void

  constructor(options: MatchOptions) {
    this.mode = options.mode
    this.code = options.code
    this.capacity = Math.min(NET.maxPlayers, Math.max(NET.minPlayers, options.capacity))
    this.clock = options.clock ?? realClock
    this.send = options.send
    this.onStart = options.onStart
    this.seed = options.seed
    this.random = options.random ?? (() => randomInt(0, 2 ** 31 - 1))
  }

  get started(): boolean {
    return this.game !== null
  }

  // ---------- Sảnh chờ ----------

  join(sessionId: string, options: JoinOptions): void {
    if (this.started) throw new Error('Ván đã bắt đầu')
    if (this.seats.length >= this.capacity) throw new Error('Phòng đã đủ người')
    // Trùng tên/skin với người đã vào: thêm số vào tên, đổi sang skin mặc định chưa ai dùng (để phân biệt quân).
    const base = (options.name ?? '').trim().slice(0, META.maxNameLength) || META.defaultName
    let name = base
    for (let n = 2; this.seats.some((s) => s.name === name); n++) name = `${base} ${n}`
    let skin = skinById(options.skin).id
    if (this.seats.some((s) => s.skin === skin)) skin = SEAT_SKINS.find((k) => !this.seats.some((s) => s.skin === k)) ?? skin
    this.seats.push({ sessionId, name, skin, kind: 'human', connected: true, playerId: null })
    if (this.mode === 'quick' && this.quickTimer === null) {
      this.quickEndsAt = this.clock.now() + NET.quickWaitSec * 1000
      this.quickTimer = this.clock.setTimeout(() => this.fillBotsAndStart(), NET.quickWaitSec * 1000)
    }
    if (this.seats.length >= this.capacity) this.start()
    else this.broadcastLobby()
  }

  /** Chủ phòng (ghế đầu) bắt đầu sớm. */
  requestStart(sessionId: string): void {
    if (this.started) return
    if (this.seats[0]?.sessionId !== sessionId) throw new GameRuleError('Chỉ chủ phòng được bắt đầu')
    if (this.seats.filter((s) => s.kind === 'human').length < NET.minPlayers) {
      throw new GameRuleError(`Cần ít nhất ${NET.minPlayers} người để bắt đầu`)
    }
    this.start()
  }

  private fillBotsAndStart(): void {
    this.quickTimer = null
    if (this.started || this.seats.length === 0) return
    const used = new Set(this.seats.map((s) => s.name))
    const skins = new Set(this.seats.map((s) => s.skin))
    while (this.seats.length < this.capacity) {
      const name = BOT_NAMES.find((n) => !used.has(n)) ?? `Bot ${this.seats.length + 1}`
      used.add(name)
      const skin = SEAT_SKINS.find((s) => !skins.has(s)) ?? SEAT_SKINS[this.seats.length % SEAT_SKINS.length]
      skins.add(skin)
      this.seats.push({ sessionId: null, name, skin, kind: 'bot', connected: true, playerId: null })
    }
    this.start()
  }

  private start(): void {
    if (this.started) return
    if (this.quickTimer !== null) this.clock.clearTimeout(this.quickTimer)
    this.quickTimer = null
    this.quickEndsAt = null
    const game = createGame(
      this.seats.map((s) => ({ name: s.name, isBot: s.kind === 'bot' })),
      this.seed ?? this.random(),
    )
    this.seats.forEach((s, i) => {
      s.playerId = game.players[i].id
    })
    this.game = game
    this.matchId = `${this.code}-${this.clock.now()}`
    this.busyUntil = this.clock.now()
    this.onStart?.()
    for (const seat of this.humanSeats()) this.sendSync(seat)
    this.schedule()
  }

  // ---------- Kết nối ----------

  /** Người chơi rời phòng. `consented` = tự thoát; không thì đang chờ kết nối lại. */
  leave(sessionId: string, consented: boolean): void {
    const seat = this.seats.find((s) => s.sessionId === sessionId)
    if (!seat) return
    if (!this.started) {
      this.seats = this.seats.filter((s) => s !== seat)
      if (this.seats.length === 0 && this.quickTimer !== null) {
        this.clock.clearTimeout(this.quickTimer)
        this.quickTimer = null
      }
      this.broadcastLobby()
      return
    }
    seat.connected = false
    if (consented) this.abandon(sessionId)
    this.broadcastSeats()
    this.schedule()
  }

  /** Hết thời gian giữ chỗ (hoặc tự thoát): ghế giao hẳn cho bot. */
  abandon(sessionId: string): void {
    const seat = this.seats.find((s) => s.sessionId === sessionId)
    if (!seat) return
    seat.kind = 'bot'
    seat.connected = true
    seat.sessionId = null
    this.broadcastSeats()
    this.schedule()
  }

  reconnect(sessionId: string): void {
    const seat = this.seats.find((s) => s.sessionId === sessionId)
    if (!seat) return
    seat.connected = true
    this.sendSync(seat)
    this.broadcastSeats()
    this.schedule()
  }

  get connectedHumans(): number {
    return this.seats.filter((s) => s.kind === 'human' && s.connected).length
  }

  // ---------- Nhận ý định ----------

  intent(sessionId: string, intent: IntentAction): void {
    const game = this.game
    const seat = this.seats.find((s) => s.sessionId === sessionId)
    if (!game || !seat?.playerId) throw new GameRuleError('Ván chưa bắt đầu')
    if (currentPlayer(game).id !== seat.playerId) throw new GameRuleError('Chưa tới lượt của bạn')
    // playerId do server gán theo ghế — client không tự khai được.
    this.apply({ ...intent, playerId: seat.playerId } as GameAction)
  }

  // ---------- Vòng điều phối ----------

  private isHuman = (id: PlayerId): boolean => {
    const seat = this.seats.find((s) => s.playerId === id)
    return seat !== undefined && seat.kind === 'human' && seat.connected
  }

  private apply(action: GameAction): GameEvent[] {
    const game = this.game
    if (!game) return []
    // Xúc xắc/thẻ dùng RNG thật của server tại thời điểm hành động.
    const seeded: GameState = { ...game, rngState: this.random() | 0 }
    const { state, events } = applyAction(seeded, action)
    this.game = state
    const now = this.clock.now()
    this.busyUntil = Math.max(now, this.busyUntil) + animationMs(events)
    this.deadline = null
    for (const seat of this.humanSeats()) {
      if (seat.sessionId) this.send(seat.sessionId, 'events', { state: sanitize(state), events, deadline: null })
    }
    this.schedule()
    return events
  }

  private safeApply(expected: GameState, action: GameAction | null): void {
    if (!action || this.game !== expected) return
    try {
      this.apply(action)
    } catch (error) {
      if (!(error instanceof GameRuleError)) throw error
    }
  }

  private schedule(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer)
    this.timer = null
    const game = this.game
    if (!game || game.phase !== 'playing') {
      this.deadline = null
      return
    }
    const now = this.clock.now()
    const wait = Math.max(0, this.busyUntil - now)
    const me = currentPlayer(game)
    const auto = autoAction(game, this.isHuman, () => NET.botLevel)
    if (auto) {
      const think = (this.isHuman(me.id) ? VISUAL.animation.autoActionDelay : VISUAL.animation.botThinkDelay) * 1000
      this.timer = this.clock.setTimeout(() => this.safeApply(game, auto), wait + think)
      return
    }
    // Người chơi phải quyết định: giờ lượt bắt đầu khi animation phía client xong.
    if (!this.deadline || this.deadline.playerId !== me.id) {
      const startedAt = now + wait
      this.deadline = { playerId: me.id, startedAt, endsAt: startedAt + ECONOMY.turnTimeLimitSec * 1000 }
      this.broadcastDeadline()
    }
    this.timer = this.clock.setTimeout(() => this.safeApply(game, getTimeoutAction(game)), Math.max(0, this.deadline.endsAt - now))
  }

  dispose(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer)
    if (this.quickTimer !== null) this.clock.clearTimeout(this.quickTimer)
    this.timer = null
    this.quickTimer = null
  }

  // ---------- Gửi tin ----------

  private humanSeats(): Seat[] {
    return this.seats.filter((s) => s.kind === 'human' && s.sessionId !== null)
  }

  seatInfo(): SeatInfo[] {
    return this.seats.map((s, i) => ({
      playerId: s.playerId,
      name: s.name,
      skin: s.skin,
      kind: s.kind,
      connected: s.connected,
      isHost: i === 0,
    }))
  }

  private deadlineInfo(): DeadlineInfo | null {
    if (!this.deadline) return null
    const now = this.clock.now()
    return {
      playerId: this.deadline.playerId,
      remainingMs: Math.max(0, this.deadline.endsAt - now),
      totalMs: this.deadline.endsAt - this.deadline.startedAt,
    }
  }

  private broadcastDeadline(): void {
    const info = this.deadlineInfo()
    if (!info) return
    for (const seat of this.humanSeats()) if (seat.connected && seat.sessionId) this.send(seat.sessionId, 'deadline', info)
  }

  lobbyFor(sessionId: string): LobbyInfo {
    return {
      code: this.code,
      mode: this.mode,
      capacity: this.capacity,
      seats: this.seatInfo(),
      you: this.seats.findIndex((s) => s.sessionId === sessionId),
      quickRemainingMs: this.quickEndsAt === null ? null : Math.max(0, this.quickEndsAt - this.clock.now()),
      started: this.started,
    }
  }

  private broadcastLobby(): void {
    for (const seat of this.humanSeats()) if (seat.sessionId) this.send(seat.sessionId, 'lobby', this.lobbyFor(seat.sessionId))
  }

  /** Trong ván: cập nhật trạng thái kết nối các ghế (dùng lại tin 'lobby'). */
  private broadcastSeats(): void {
    for (const seat of this.humanSeats()) if (seat.connected && seat.sessionId) this.send(seat.sessionId, 'lobby', this.lobbyFor(seat.sessionId))
  }

  private sendSync(seat: Seat): void {
    if (!this.game || !seat.sessionId) return
    this.send(seat.sessionId, 'sync', {
      state: sanitize(this.game),
      seats: this.seatInfo(),
      you: seat.playerId,
      matchId: this.matchId,
      deadline: this.deadlineInfo(),
    })
  }
}

/** State gửi cho client: bỏ trạng thái RNG để không ai đoán trước được xúc xắc/thẻ. */
export function sanitize(state: GameState): GameState {
  return { ...state, rngState: 0 }
}

export function randomCode(random: () => number = () => randomInt(0, NET.codeAlphabet.length)): string {
  let code = ''
  for (let i = 0; i < NET.codeLength; i++) code += NET.codeAlphabet[random() % NET.codeAlphabet.length]
  return code
}
