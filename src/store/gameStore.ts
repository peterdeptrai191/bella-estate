import { create } from 'zustand'
import { applyAction, createGame, type GameAction, type GameState, type NewPlayer } from '../game-core'
import { useAnimationStore } from './animationStore'

/**
 * Store nối game-core với UI/scene. Store chỉ gọi hàm của game-core và lưu kết quả —
 * không tự viết luật chơi. Event của mỗi action được đẩy sang hàng đợi animation;
 * state game-core cập nhật ngay, không chờ animation.
 */
interface GameStore {
  game: GameState | null
  startGame: (players: NewPlayer[], seed?: number | string) => void
  dispatch: (action: GameAction) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  startGame: (players, seed = Date.now()) => {
    const game = createGame(players, seed)
    useAnimationStore.getState().reset(game)
    set({ game })
  },
  dispatch: (action) => {
    const game = get().game
    if (!game) return
    const { state, events } = applyAction(game, action)
    set({ game: state })
    useAnimationStore.getState().enqueue(events)
  },
  reset: () => set({ game: null }),
}))
