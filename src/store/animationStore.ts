import { create } from 'zustand'
import type { GameEvent, GameState } from '../game-core'
import { applyEventToView, viewFromGame, type BoardView } from './boardView'

export interface QueuedEvent {
  id: number
  event: GameEvent
}

/**
 * Hàng đợi animation. game-core không chờ animation: mỗi lần dispatch, event được đẩy vào đây
 * và event player (src/scene/events) phát lần lượt, cập nhật `view` sau từng event.
 */
interface AnimationStore {
  view: BoardView | null
  queue: QueuedEvent[]
  enqueue: (events: GameEvent[]) => void
  /** Event player gọi sau khi phát xong event đầu hàng đợi. */
  completeHead: () => void
  /** Áp ngay một event lên view (event player gọi ở đúng thời điểm trong animation). */
  applyToView: (event: GameEvent) => void
  reset: (state: GameState) => void
}

let nextId = 1

export const useAnimationStore = create<AnimationStore>((set) => ({
  view: null,
  queue: [],
  enqueue: (events) =>
    set((s) => ({ queue: [...s.queue, ...events.map((event) => ({ id: nextId++, event }))] })),
  completeHead: () => set((s) => ({ queue: s.queue.slice(1) })),
  applyToView: (event) => set((s) => (s.view ? { view: applyEventToView(s.view, event) } : s)),
  reset: (state) => set({ view: viewFromGame(state), queue: [] }),
}))

/** Còn animation đang chờ phát? UI dùng để giãn nhịp tự chơi. */
export const useIsAnimating = () => useAnimationStore((s) => s.queue.length > 0)
