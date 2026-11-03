export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
  money: number
  position: number
  isBot: boolean
  bankrupt: boolean
}

export type GamePhase = 'lobby' | 'playing' | 'finished'

export interface GameState {
  phase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  round: number
}
