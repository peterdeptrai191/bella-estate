import { create } from 'zustand'
import { applyAction, createGame, type GameAction, type GameEvent, type GameState, type NewPlayer } from '../game-core'

/**
 * Store nối game-core với UI/scene. Store chỉ gọi hàm của game-core
 * và lưu kết quả — không tự viết luật chơi ở đây.
 */
interface GameStore {
  game: GameState | null
  /** Event của action gần nhất — scene/UI dựa vào đây để chạy animation. */
  lastEvents: GameEvent[]
  startGame: (players: NewPlayer[], seed?: number | string) => void
  dispatch: (action: GameAction) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  lastEvents: [],
  startGame: (players, seed = Date.now()) => set({ game: createGame(players, seed), lastEvents: [] }),
  dispatch: (action) => {
    const game = get().game
    if (!game) return
    const { state, events } = applyAction(game, action)
    set({ game: state, lastEvents: events })
  },
  reset: () => set({ game: null, lastEvents: [] }),
}))
