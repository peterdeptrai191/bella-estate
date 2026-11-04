/**
 * Một phòng online — logic THUẦN trên dữ liệu JSON (lưu được vào Redis), giống cách Bella Poker chạy trên
 * Vercel: không có tiến trình chạy liên tục, mỗi lần có người hỏi server (poll) hoặc gửi ý định thì
 * `tick(room, now)` cho ván chạy tới thời điểm hiện tại (bot đi, hết giờ tự hành động, lấp bot…).
 *
 * - Server-authoritative: client chỉ gửi ý định, `playerId` gán theo khóa bí mật của ghế, kiểm tra bằng game-core.
 * - Xúc xắc/thẻ: trước mỗi action, trạng thái RNG được thay bằng số ngẫu nhiên thật của server;
 *   state gửi cho client không kèm trạng thái RNG.
 * - Mất kết nối = quá `NET.disconnectSec` không thấy người chơi hỏi server → bot chơi thay;
 *   quá `NET.reconnectSec` → ghế giao hẳn cho bot. Quay lại (hỏi server bằng đúng khóa) thì nhận lại toàn bộ state.
 */
import { ECONOMY } from '../config/economy'
import { META, SEAT_SKINS, skinById } from '../config/skins'
import { VISUAL } from '../config/visual'
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
} from '../game-core'
import { NET, type DeadlineInfo, type IntentAction, type JoinRequest, type LobbyInfo, type RoomView, type SeatInfo } from '../net/protocol'
import { animationMs } from './pacing'

export interface RoomSeat {
  /** Khóa bí mật của người chơi (null với ghế bot). */
  token: string | null
  name: string
  skin: string
  kind: 'human' | 'bot'
  playerId: PlayerId | null
  /** Lần cuối người chơi hỏi server (ms). */
  lastSeen: number
}

export interface EventBatch {
  seq: number
  events: GameEvent[]
}

export interface Room {
  code: string
  mode: 'private' | 'quick'
  capacity: number
  createdAt: number
  /** Ghép nhanh: lúc này mà chưa đủ người thì thêm bot. */
  quickDeadline: number | null
  seats: RoomSeat[]
  game: GameState | null
  matchId: string
  /** Client còn đang phát animation tới thời điểm này. */
  busyUntil: number
  deadline: { playerId: PlayerId; startedAt: number; endsAt: number } | null
  seq: number
  log: EventBatch[]
}

/** Nguồn ngẫu nhiên do nơi gọi cung cấp (API dùng crypto; test dùng số cố định). */
export interface Rng {
  int: (maxExclusive: number) => number
}

const BOT_NAMES = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Khang', 'Vy']

export function randomCode(rng: Rng): string {
  let code = ''
  for (let i = 0; i < NET.codeLength; i++) code += NET.codeAlphabet[rng.int(NET.codeAlphabet.length)]
  return code
}

export function randomToken(rng: Rng): string {
  let token = ''
  for (let i = 0; i < 32; i++) token += 'abcdefghijklmnopqrstuvwxyz0123456789'[rng.int(36)]
  return token
}

export function createRoom(code: string, mode: 'private' | 'quick', capacity: number, now: number): Room {
  return {
    code,
    mode,
    capacity: mode === 'quick' ? NET.maxPlayers : Math.min(NET.maxPlayers, Math.max(NET.minPlayers, Math.floor(capacity) || NET.maxPlayers)),
    createdAt: now,
    quickDeadline: mode === 'quick' ? now + NET.quickWaitSec * 1000 : null,
    seats: [],
    game: null,
    matchId: '',
    busyUntil: now,
    deadline: null,
    seq: 0,
    log: [],
  }
}

const seatOf = (room: Room, token: string) => room.seats.find((s) => s.token !== null && s.token === token)

function connected(seat: RoomSeat, now: number): boolean {
  return seat.kind === 'human' && now - seat.lastSeen <= NET.disconnectSec * 1000
}

// ---------- Sảnh chờ ----------

/** Thêm người chơi vào phòng. Trả về chỉ số ghế. */
export function joinRoom(room: Room, request: JoinRequest, token: string, now: number, rng: Rng): number {
  if (room.game) throw new GameRuleError('Ván đã bắt đầu')
  if (room.seats.length >= room.capacity) throw new GameRuleError('Phòng đã đủ người')
  // Trùng tên/skin với người đã vào: thêm số vào tên, đổi sang skin mặc định chưa ai dùng (để phân biệt quân).
  const base = String(request.name ?? '').trim().slice(0, META.maxNameLength) || META.defaultName
  let name = base
  for (let n = 2; room.seats.some((s) => s.name === name); n++) name = `${base} ${n}`
  let skin = skinById(request.skin).id
  if (room.seats.some((s) => s.skin === skin)) skin = SEAT_SKINS.find((k) => !room.seats.some((s) => s.skin === k)) ?? skin
  room.seats.push({ token, name, skin, kind: 'human', playerId: null, lastSeen: now })
  if (room.seats.length >= room.capacity) start(room, now, rng)
  return room.seats.length - 1
}

/** Chủ phòng (ghế đầu) bắt đầu sớm khi đã có ít nhất 2 người. */
export function requestStart(room: Room, token: string, now: number, rng: Rng): void {
  if (room.game) return
  if (room.seats[0]?.token !== token) throw new GameRuleError('Chỉ chủ phòng được bắt đầu')
  if (room.seats.filter((s) => s.kind === 'human').length < NET.minPlayers) {
    throw new GameRuleError(`Cần ít nhất ${NET.minPlayers} người để bắt đầu`)
  }
  start(room, now, rng)
}

function fillBots(room: Room): void {
  const names = new Set(room.seats.map((s) => s.name))
  const skins = new Set(room.seats.map((s) => s.skin))
  while (room.seats.length < room.capacity) {
    const name = BOT_NAMES.find((n) => !names.has(n)) ?? `Bot ${room.seats.length + 1}`
    names.add(name)
    const skin = SEAT_SKINS.find((s) => !skins.has(s)) ?? SEAT_SKINS[room.seats.length % SEAT_SKINS.length]
    skins.add(skin)
    room.seats.push({ token: null, name, skin, kind: 'bot', playerId: null, lastSeen: 0 })
  }
}

function start(room: Room, now: number, rng: Rng): void {
  if (room.game) return
  const game = createGame(
    room.seats.map((s) => ({ name: s.name, isBot: s.kind === 'bot' })),
    rng.int(2 ** 31 - 1),
  )
  room.seats.forEach((s, i) => {
    s.playerId = game.players[i].id
  })
  room.game = game
  room.quickDeadline = null
  room.matchId = `${room.code}-${now}`
  room.busyUntil = now
  room.deadline = null
}

/** Người chơi tự rời phòng. Trước khi bắt đầu: bỏ ghế. Trong ván: ghế giao hẳn cho bot. */
export function leaveRoom(room: Room, token: string): void {
  const seat = seatOf(room, token)
  if (!seat) return
  if (!room.game) {
    room.seats = room.seats.filter((s) => s !== seat)
    return
  }
  seat.kind = 'bot'
  seat.token = null
}

// ---------- Ván đấu ----------

function apply(room: Room, action: GameAction, now: number, rng: Rng): void {
  const game = room.game
  if (!game) return
  // Xúc xắc/thẻ dùng RNG thật của server tại thời điểm hành động.
  const { state, events } = applyAction({ ...game, rngState: rng.int(2 ** 31 - 1) | 0 }, action)
  room.game = state
  room.busyUntil = Math.max(now, room.busyUntil) + animationMs(events)
  room.deadline = null
  room.seq++
  room.log.push({ seq: room.seq, events })
  if (room.log.length > NET.logSize) room.log.splice(0, room.log.length - NET.logSize)
}

/** Ý định của người chơi (đã được xác thực bằng khóa ghế). */
export function intent(room: Room, token: string, action: IntentAction, now: number, rng: Rng): void {
  const seat = seatOf(room, token)
  const game = room.game
  if (!game || !seat?.playerId) throw new GameRuleError('Ván chưa bắt đầu')
  seat.lastSeen = now
  if (seat.kind !== 'human') throw new GameRuleError('Ghế này đã giao cho bot')
  if (currentPlayer(game).id !== seat.playerId) throw new GameRuleError('Chưa tới lượt của bạn')
  // playerId do server gán theo ghế — client không tự khai được.
  apply(room, { ...action, playerId: seat.playerId } as GameAction, now, rng)
}

/** Cập nhật "còn ở đây" cho người chơi. Trả về true nếu có thay đổi đáng lưu. */
export function touch(room: Room, token: string, now: number): boolean {
  const seat = seatOf(room, token)
  if (!seat || seat.kind !== 'human') return false
  // Không ghi mỗi lần hỏi (đỡ tốn lệnh Redis): chỉ khi đã lâu, hoặc vừa quay lại sau mất kết nối.
  if (now - seat.lastSeen < 3000) return false
  seat.lastSeen = now
  return true
}

/**
 * Cho phòng chạy tới thời điểm `now`: lấp bot ghép nhanh, giao ghế bỏ đi cho bot, bot/bước hiển nhiên tự đi,
 * hết giờ thì tự hành động. Trả về true nếu phòng thay đổi.
 */
export function tick(room: Room, now: number, rng: Rng): boolean {
  let changed = false
  if (!room.game) {
    if (room.mode === 'quick' && room.quickDeadline !== null && now >= room.quickDeadline && room.seats.length > 0) {
      fillBots(room)
      start(room, now, rng)
      changed = true
    } else {
      return false
    }
  }
  // Mất kết nối quá lâu: giao hẳn ghế cho bot.
  for (const seat of room.seats) {
    if (seat.kind === 'human' && now - seat.lastSeen > NET.reconnectSec * 1000) {
      seat.kind = 'bot'
      seat.token = null
      changed = true
    }
  }
  const isHuman = (id: PlayerId) => {
    const seat = room.seats.find((s) => s.playerId === id)
    return seat !== undefined && connected(seat, now)
  }
  for (let guard = 0; guard < 200; guard++) {
    const game = room.game
    if (!game || game.phase !== 'playing') {
      if (room.deadline) {
        room.deadline = null
        changed = true
      }
      break
    }
    const me = currentPlayer(game)
    const auto = autoAction(game, isHuman, () => NET.botLevel)
    if (auto) {
      const think = (isHuman(me.id) ? VISUAL.animation.autoActionDelay : VISUAL.animation.botThinkDelay) * 1000
      if (now < room.busyUntil + think) break
      safeApply(room, auto, now, rng)
      changed = true
      continue
    }
    // Người chơi phải quyết định: giờ lượt bắt đầu khi animation phía client xong.
    if (!room.deadline || room.deadline.playerId !== me.id) {
      const startedAt = Math.max(now, room.busyUntil)
      room.deadline = { playerId: me.id, startedAt, endsAt: startedAt + ECONOMY.turnTimeLimitSec * 1000 }
      changed = true
    }
    if (now < room.deadline.endsAt) break
    safeApply(room, getTimeoutAction(game), now, rng)
    changed = true
  }
  return changed
}

function safeApply(room: Room, action: GameAction | null, now: number, rng: Rng): void {
  if (!action) return
  try {
    apply(room, action, now, rng)
  } catch (error) {
    if (!(error instanceof GameRuleError)) throw error
  }
}

// ---------- Câu trả lời cho client ----------

/** State gửi cho client: bỏ trạng thái RNG để không ai đoán trước được xúc xắc/thẻ. */
export function sanitize(state: GameState): GameState {
  return { ...state, rngState: 0 }
}

export function seatInfo(room: Room, now: number): SeatInfo[] {
  return room.seats.map((s, i) => ({
    playerId: s.playerId,
    name: s.name,
    skin: s.skin,
    kind: s.kind,
    connected: s.kind === 'bot' || connected(s, now),
    isHost: i === 0,
  }))
}

function deadlineInfo(room: Room, now: number): DeadlineInfo | null {
  if (!room.deadline) return null
  return {
    playerId: room.deadline.playerId,
    remainingMs: Math.max(0, room.deadline.endsAt - now),
    totalMs: room.deadline.endsAt - room.deadline.startedAt,
  }
}

/**
 * Câu trả lời cho người giữ khóa `token`. `since` = số lô event client đã có (-1 = chưa có gì);
 * client mới vào / tụt quá xa (lô cũ đã bị cắt khỏi log) thì nhận lại toàn bộ state.
 */
export function viewFor(room: Room, token: string, since: number, now: number): RoomView {
  const you = room.seats.findIndex((s) => s.token !== null && s.token === token)
  const lobby: LobbyInfo = {
    code: room.code,
    mode: room.mode,
    capacity: room.capacity,
    seats: seatInfo(room, now),
    you,
    quickRemainingMs: room.quickDeadline === null ? null : Math.max(0, room.quickDeadline - now),
    started: room.game !== null,
  }
  if (!room.game) return { lobby, game: null, deadline: null }
  const oldest = room.log[0]?.seq ?? room.seq + 1
  const full = since < 0 || since > room.seq || (since < room.seq && since + 1 < oldest)
  const events = full ? [] : room.log.filter((b) => b.seq > since).flatMap((b) => b.events)
  return {
    lobby,
    game: {
      matchId: room.matchId,
      you: you >= 0 ? room.seats[you].playerId : null,
      state: sanitize(room.game),
      seq: room.seq,
      full,
      events,
    },
    deadline: deadlineInfo(room, now),
  }
}
