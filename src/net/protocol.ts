/**
 * Giao thức client ↔ server (Colyseus). Chỉ có kiểu dữ liệu và hằng số — dùng chung cho
 * client (src/store/net.ts) và server (server/src). Server là nguồn sự thật duy nhất:
 * client chỉ gửi Ý ĐỊNH (action không có playerId), server gán ghế, kiểm tra bằng game-core rồi phát event.
 */
import type { BotLevel } from '../config/bots'
import type { GameAction, GameEvent, GameState, PlayerId } from '../game-core'

/** Tên 2 loại phòng đăng ký trên server. */
export const ROOM_PRIVATE = 'private'
export const ROOM_QUICK = 'quick'

export const NET = {
  /** Mã phòng riêng: 6 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I/L). */
  codeLength: 6,
  codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  minPlayers: 2,
  maxPlayers: 4,
  /** Ghép trận nhanh: chờ tối đa bấy nhiêu giây rồi thêm bot cho đủ ghế. */
  quickWaitSec: 30,
  /** Mất kết nối: giữ chỗ bấy nhiêu giây (bot chơi thay trong lúc đó). */
  reconnectSec: 60,
  /** Mức bot server dùng để lấp ghế và chơi thay. */
  botLevel: 'normal' as BotLevel,
  defaultPort: 2567,
} as const

export interface JoinOptions {
  name: string
  skin: string
  /** Chỉ khi tạo phòng riêng: số người 2–4. */
  capacity?: number
}

export type IntentAction = GameAction extends infer A ? (A extends { playerId: PlayerId } ? Omit<A, 'playerId'> : never) : never

export interface SeatInfo {
  /** Trước khi bắt đầu chưa có playerId (null). */
  playerId: PlayerId | null
  name: string
  skin: string
  kind: 'human' | 'bot'
  connected: boolean
  isHost: boolean
}

export interface LobbyInfo {
  code: string
  mode: 'private' | 'quick'
  capacity: number
  seats: SeatInfo[]
  /** Chỉ số ghế của chính client nhận tin. */
  you: number
  /** Ghép nhanh: còn bao nhiêu ms trước khi thêm bot. */
  quickRemainingMs: number | null
  started: boolean
}

export interface DeadlineInfo {
  playerId: PlayerId
  remainingMs: number
  totalMs: number
}

// Server → client
export interface SyncMessage {
  state: GameState
  seats: SeatInfo[]
  you: PlayerId | null
  matchId: string
  deadline: DeadlineInfo | null
}

export interface EventsMessage {
  state: GameState
  events: GameEvent[]
  deadline: DeadlineInfo | null
}

export interface ServerMessages {
  lobby: LobbyInfo
  sync: SyncMessage
  events: EventsMessage
  deadline: DeadlineInfo
  error: { message: string }
}

// Client → server
export interface ClientMessages {
  intent: { action: IntentAction }
  /** Chủ phòng bắt đầu sớm khi đã có ít nhất 2 người. */
  start: Record<string, never>
}
