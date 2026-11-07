import { useEffect } from 'react'
import { useAnimationStore } from '../../store/animationStore'
import { viewMatchesGame } from '../../store/boardView'
import { useGameStore } from '../../store/gameStore'
import { useVisualStore } from '../../store/visualStore'
import { playEvent } from './eventPlayer'

/**
 * Phát lần lượt các event trong hàng đợi. Không render gì.
 * Event chưa phát xong thì event sau chờ — game-core thì không chờ ai.
 */
export function EventPlayer() {
  useEffect(() => {
    let running = false
    let disposed = false
    const pump = async () => {
      if (running) return
      running = true
      try {
        while (!disposed) {
          const head = useAnimationStore.getState().queue[0]
          if (!head) break
          try {
            await playEvent(head.event)
          } catch (error) {
            // Animation lỗi không được làm kẹt hàng đợi: áp event rồi đi tiếp.
            console.error('[event-player]', head.event.type, error)
            useAnimationStore.getState().applyToView(head.event)
          }
          useAnimationStore.getState().completeHead()
          const gap = useVisualStore.getState().visual.animation.eventGap
          if (gap > 0) await new Promise((r) => setTimeout(r, gap * 1000))
        }
      } finally {
        running = false
      }
      // Phát hết hàng đợi: đối chiếu với state thật; lệch thì dựng lại view (không để tiền/nhà hiển thị sai).
      const anim = useAnimationStore.getState()
      const game = useGameStore.getState().game
      if (!disposed && anim.queue.length === 0 && anim.view && game && !viewMatchesGame(anim.view, game)) {
        console.warn('[event-player] view lệch state, dựng lại')
        anim.reset(game)
      }
    }
    void pump()
    const unsubscribe = useAnimationStore.subscribe((s, prev) => {
      if (s.queue.length > prev.queue.length) void pump()
    })
    return () => {
      disposed = true
      unsubscribe()
    }
  }, [])
  return null
}
