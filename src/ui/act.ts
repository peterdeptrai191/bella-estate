/** Gửi action từ giao diện: bấm nút là action đi thẳng vào game-core qua store (không tự xử lý luật). */
import { playSound, unlockAudio } from '../audio/soundPlayer'
import { GameRuleError, type GameAction } from '../game-core'
import { useGameStore } from '../store/gameStore'

export function act(...actions: GameAction[]): void {
  unlockAudio()
  playSound('click')
  try {
    useGameStore.getState().dispatchMany(actions)
  } catch (error) {
    // State đã đổi trước khi bấm (vd. hết giờ): bỏ qua cú bấm muộn.
    if (!(error instanceof GameRuleError)) throw error
    console.warn('[ui] action bị từ chối', actions, error.message)
  }
}
