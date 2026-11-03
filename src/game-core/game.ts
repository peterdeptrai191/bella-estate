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

/**
 * Tạo ván mới. `seed` quyết định toàn bộ xúc xắc và thẻ:
 * cùng seed + cùng chuỗi action luôn cho cùng kết quả (replay được).
 */
export function createGame(players: NewPlayer[], seed: number | string): GameState {
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
    })),
    tiles: Array.from({ length: BOARD_SIZE }, () => ({ owner: null, level: 0 })),
    currentPlayerIndex: 0,
    round: 1,
    festivalTile: null,
    rngState: seedToRngState(seed),
    turn: freshTurn(),
    winner: null,
    winReason: null,
  }
}
