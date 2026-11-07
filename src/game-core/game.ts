import { BOARD_SIZE } from '../config/board'
import { ECONOMY } from '../config/economy'
import { seedToRngState } from './rng'
import { freshTurn } from './turn'
import type { GameState } from './types'

export interface NewPlayer {
  name: string
  isBot?: boolean
}

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

export interface GameOptions {
  /** Số vòng tối đa; phải là một trong ECONOMY.roundOptions (khác thì dùng mặc định). */
  maxRounds?: number
}

/** Số vòng hợp lệ: thuộc danh sách lựa chọn, không thì mặc định. */
export function normalizeMaxRounds(value: unknown): number {
  const options: readonly number[] = ECONOMY.roundOptions
  return typeof value === 'number' && options.includes(value) ? value : ECONOMY.maxRounds
}

/**
 * Tạo ván mới. `seed` quyết định toàn bộ xúc xắc và thẻ:
 * cùng seed + cùng chuỗi action luôn cho cùng kết quả (replay được).
 */
export function createGame(players: NewPlayer[], seed: number | string, options: GameOptions = {}): GameState {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`Cần ${MIN_PLAYERS}–${MAX_PLAYERS} người chơi`)
  }
  return {
    phase: 'playing',
    players: players.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name,
      isBot: p.isBot ?? false,
      money: ECONOMY.startingMoney,
      position: 0,
      bankrupt: false,
      islandTurnsLeft: 0,
      heldCards: [],
      rentDiscount: false,
      airportTicket: false,
      passedStart: false,
    })),
    tiles: Array.from({ length: BOARD_SIZE }, () => ({ owner: null, level: 0 })),
    currentPlayerIndex: 0,
    round: 1,
    maxRounds: normalizeMaxRounds(options.maxRounds),
    festivalTile: null,
    festivalCount: 0,
    rngState: seedToRngState(seed),
    turn: freshTurn(),
    winner: null,
    winReason: null,
  }
}
