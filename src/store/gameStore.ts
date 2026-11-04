import { create } from 'zustand'
import { applyAction, createGame, type GameAction, type GameState, type NewPlayer, type PlayerId } from '../game-core'
import { useAnimationStore } from './animationStore'

/**
 * Store nối game-core với UI/scene. Store chỉ gọi hàm của game-core và lưu kết quả —
 * không tự viết luật chơi. Event của mỗi action được đẩy sang hàng đợi animation;
 * state game-core cập nhật ngay, không chờ animation.
 */
interface GameStore {
  game: GameState | null
  /** Người chơi điều khiển trên máy này (null = toàn bot). */
  humanId: PlayerId | null
  /** Tăng sau mỗi action — dùng để biết đã sang một quyết định mới (đồng hồ lượt). */
  actionCount: number
  startGame: (players: NewPlayer[], seed?: number | string) => void
  /** Áp một action. Action sai luật ném GameRuleError (state giữ nguyên). */
  dispatch: (action: GameAction) => void
  /** Áp nhiều action liên tiếp (vd. mua đất rồi xây 2 nhà). Dừng ở action sai luật đầu tiên. */
  dispatchMany: (actions: GameAction[]) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  humanId: null,
  actionCount: 0,
  startGame: (players, seed = Date.now()) => {
    const game = createGame(players, seed)
    useAnimationStore.getState().reset(game)
    const human = game.players.find((p) => !p.isBot)
    set({ game, humanId: human?.id ?? null, actionCount: 0 })
  },
  dispatch: (action) => {
    const game = get().game
    if (!game) return
    const { state, events } = applyAction(game, action)
    set({ game: state, actionCount: get().actionCount + 1 })
    useAnimationStore.getState().enqueue(events)
  },
  dispatchMany: (actions) => {
    for (const action of actions) get().dispatch(action)
  },
  reset: () => set({ game: null, humanId: null, actionCount: 0 }),
}))
