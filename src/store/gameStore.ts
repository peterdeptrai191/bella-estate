import { create } from 'zustand'
import { createGame, type GameState, type NewPlayer } from '../game-core'

/**
 * Store nối game-core với UI/scene. Store chỉ gọi hàm của game-core
 * và lưu kết quả — không tự viết luật chơi ở đây.
 */
interface GameStore {
  game: GameState | null
  startGame: (players: NewPlayer[]) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  startGame: (players) => set({ game: createGame(players) }),
  reset: () => set({ game: null }),
}))
