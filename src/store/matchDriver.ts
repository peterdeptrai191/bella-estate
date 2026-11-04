/**
 * Vòng điều phối ván: mỗi khi hàng đợi animation trống thì
 * - lượt của bot / bước hiển nhiên của người → tự dispatch sau một nhịp ngắn;
 * - người chơi cần quyết định → bật đồng hồ lượt; hết giờ thì dùng `getTimeoutAction` của game-core.
 * Game-core vẫn không chờ ai: driver chỉ quyết định KHI NÀO gửi action tiếp theo.
 */
import { ECONOMY } from '../config/economy'
import { currentPlayer, getTimeoutAction, GameRuleError, type GameAction, type GameState } from '../game-core'
import { useAnimationStore } from './animationStore'
import { useGameStore } from './gameStore'
import { autoAction } from './match'
import { useUiStore } from './uiStore'
import { useVisualStore } from './visualStore'

/** Gửi action nếu state chưa đổi kể từ lúc quyết định (tránh gửi trùng/sai thời điểm). */
function dispatchIfCurrent(expected: GameState, action: GameAction) {
  const store = useGameStore.getState()
  if (store.game !== expected) return
  try {
    store.dispatch(action)
  } catch (error) {
    if (!(error instanceof GameRuleError)) throw error
    console.warn('[match] action bị từ chối', action, error.message)
  }
}

export function startMatchDriver(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let decisionKey = -1

  const evaluate = () => {
    clearTimeout(timer)
    timer = undefined
    const { game, humanId, actionCount } = useGameStore.getState()
    const ui = useUiStore.getState()
    if (!game || game.phase !== 'playing') {
      if (ui.deadline) ui.setDeadline(null)
      return
    }
    if (useAnimationStore.getState().queue.length > 0) return

    const a = useVisualStore.getState().visual.animation
    const me = currentPlayer(game)
    const controller = ui.autoplayHuman ? null : humanId
    const isHuman = me.id === controller

    // Mỗi quyết định mới (sau mỗi action) có 20 giây — kể cả bot, để vòng đồng hồ luôn chạy.
    if (decisionKey !== actionCount || ui.deadline?.playerId !== me.id) {
      decisionKey = actionCount
      const now = Date.now()
      ui.setDeadline({ playerId: me.id, startedAt: now, endsAt: now + ECONOMY.turnTimeLimitSec * ui.turnTimeScale * 1000 })
    }

    const auto = autoAction(game, controller)
    if (auto) {
      timer = setTimeout(() => dispatchIfCurrent(game, auto), (isHuman ? a.autoActionDelay : a.botThinkDelay) * 1000)
      return
    }
    const deadline = useUiStore.getState().deadline
    const remaining = deadline ? deadline.endsAt - Date.now() : 0
    timer = setTimeout(() => {
      const timeout = getTimeoutAction(game)
      if (timeout) dispatchIfCurrent(game, timeout)
    }, Math.max(0, remaining))
  }

  const unsubGame = useGameStore.subscribe(evaluate)
  const unsubAnim = useAnimationStore.subscribe((s, prev) => {
    if (s.queue.length === 0 && prev.queue.length > 0) evaluate()
  })
  const unsubUi = useUiStore.subscribe((s, prev) => {
    if (s.autoplayHuman !== prev.autoplayHuman) evaluate()
  })
  evaluate()
  return () => {
    clearTimeout(timer)
    unsubGame()
    unsubAnim()
    unsubUi()
  }
}
