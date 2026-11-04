/**
 * Giao thức client ↔ server online (HTTP + polling, giống Bella Poker). Chỉ có kiểu dữ liệu và hằng số —
 * dùng chung cho client (src/store/net.ts) và API (api/estate, logic ở src/online).
 * Server là nguồn sự thật duy nhất: client chỉ gửi Ý ĐỊNH (action không có playerId), server gán ghế,
 * kiểm tra bằng game-core rồi trả state + event.
 */
import type { BotLevel } from '../config/bots'
import type { GameAction, GameEvent, GameState, PlayerId } from '../game-core'

export const API_PATH = '/api/estate'

export const NET = {
  /** Mã phòng riêng: 6 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I/L). */
  codeLength: 6,
  codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  minPlayers: 2,
  maxPlayers: 4,
  /** Ghép trận nhanh: chờ tối đa bấy nhiêu giây rồi thêm bot cho đủ ghế. */
  quickWaitSec: 30,
  /** Không nhận được tin của người chơi quá bấy nhiêu giây thì coi như mất kết nối (bot chơi thay). */
  disconnectSec: 8,
  /** Mất kết nối: giữ chỗ bấy nhiêu giây; quá thì ghế giao hẳn cho bot. */
  reconnectSec: 60,
  /** Nhịp hỏi server (ms): trong ván / ở sảnh chờ / khi tab bị ẩn. */
  pollMs: 900,
  lobbyPollMs: 1500,
  hiddenPollMs: 4000,
  /** Mức bot server dùng để lấp ghế và chơi thay. */
  botLevel: 'normal' as BotLevel,
  /** Giữ lại bấy nhiêu lô event gần nhất để client hỏi bù (quá thì gửi lại toàn bộ state). */
  logSize: 120,
  /** Phòng tự xóa sau bấy nhiêu giây không ai đụng tới. */
  roomTtlSec: 6 * 3600,
} as const

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
  /** Chỉ số ghế của chính người hỏi. */
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

/** Phần ván đấu trong câu trả lời. `full` = gửi lại toàn bộ (client dựng lại màn hình), không thì chỉ event mới. */
export interface GameSnapshot {
  matchId: string
  you: PlayerId | null
  state: GameState
  /** Số thứ tự lô event cuối cùng đã gồm trong `state`. Lần hỏi sau gửi lại số này. */
  seq: number
  full: boolean
  events: GameEvent[]
}

export interface RoomView {
  lobby: LobbyInfo
  game: GameSnapshot | null
  deadline: DeadlineInfo | null
}

export interface JoinRequest {
  name: string
  skin: string
}

export type ApiRequest =
  | ({ op: 'create'; capacity: number } & JoinRequest)
  | ({ op: 'join'; code: string } & JoinRequest)
  | ({ op: 'quick' } & JoinRequest)
  | { op: 'start'; code: string; token: string }
  | { op: 'intent'; code: string; token: string; action: IntentAction; since: number }
  | { op: 'leave'; code: string; token: string }
  | { op: 'poll'; code: string; token: string; since: number }

/** Vào phòng thành công: mã phòng + khóa bí mật của ghế (lưu lại để vào lại khi mất mạng / tải lại trang). */
export interface JoinResponse {
  code: string
  token: string
  view: RoomView
}

export interface ApiError {
  error: string
}
