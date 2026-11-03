/**
 * game-core: toàn bộ luật chơi, TypeScript thuần.
 * KHÔNG import React, Three.js, Zustand hay bất kỳ thứ gì phụ thuộc trình duyệt.
 */
import { ECONOMY } from '../config/economy'
import type { GameState } from './types'

export * from './types'

export interface NewPlayer {
  name: string
  isBot?: boolean
}

export function createGame(players: NewPlayer[]): GameState {
  if (players.length < 2 || players.length > 4) {
    throw new Error('Cần 2–4 người chơi')
  }
  return {
    phase: 'playing',
    players: players.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name,
      money: ECONOMY.startingMoney,
      position: 0,
      isBot: p.isBot ?? false,
      bankrupt: false,
    })),
    currentPlayerIndex: 0,
    round: 1,
  }
}
