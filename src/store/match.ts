/**
 * Xem trước các lựa chọn cho popup (mua đất kèm nhà, xây tới cấp nào…) bằng cách thử chính reducer.
 * Không có luật chơi mới ở đây. (`humanPrompt` / `autoAction` nằm ở game-core/flow.ts.)
 */
import { applyAction, currentPlayer, GameRuleError, getTimeoutAction, isLegal, type GameAction, type GameState } from '../game-core'

export interface LevelOption {
  /** Cấp sau khi xây (0 = chỉ đất, 1–3 nhà, 4 = Landmark). */
  level: number
  /** Tổng tiền phải trả để đạt cấp này (tính từ hiện tại, gồm cả tiền đất nếu đang mua). */
  cost: number
  /** Chuỗi action để đạt cấp này. */
  actions: GameAction[]
}

/**
 * Các cấp có thể đạt được ngay trong lần dừng này, bằng cách thử chính reducer của game-core:
 * `withBuy` = mua đất trước (popup Mua đất), không thì chỉ xây trên ô đang có.
 */
export function levelOptions(state: GameState, tileIndex: number, withBuy: boolean): LevelOption[] {
  const playerId = currentPlayer(state).id
  const startMoney = currentPlayer(state).money
  const options: LevelOption[] = []
  const actions: GameAction[] = []
  let s = state
  const step = (action: GameAction): boolean => {
    try {
      s = applyAction(s, action).state
      actions.push(action)
      return true
    } catch (error) {
      if (error instanceof GameRuleError) return false
      throw error
    }
  }
  if (withBuy) {
    if (!step({ type: 'BUY', playerId })) return []
    options.push({ level: s.tiles[tileIndex].level, cost: startMoney - currentPlayer(s).money, actions: [...actions] })
  }
  while (step({ type: 'BUILD', playerId, tileIndex })) {
    options.push({ level: s.tiles[tileIndex].level, cost: startMoney - currentPlayer(s).money, actions: [...actions] })
  }
  return options
}

/** Còn dùng được action này không (để UI chặn bấm đúp / bấm sau khi state đã đổi). */
export function canDo(state: GameState | null, action: GameAction): boolean {
  return state !== null && isLegal(state, action)
}

/** State sau khi áp thử chuỗi action (để popup xem trước tiền thuê / giá mua lại). Sai luật → null. */
export function previewAfter(state: GameState, actions: GameAction[]): GameState | null {
  let s = state
  try {
    for (const action of actions) s = applyAction(s, action).state
    return s
  } catch (error) {
    if (error instanceof GameRuleError) return null
    throw error
  }
}

/**
 * Bán tự động khi thiếu tiền: dãy action SELL theo đúng lựa chọn mặc định của game-core (bán ô rẻ nhất trước)
 * cho tới khi hết nợ. Thử trên bản sao state nên gửi được một lần (online: một yêu cầu, không bán trùng).
 */
export function autoSellPlan(state: GameState): GameAction[] {
  const plan: GameAction[] = []
  let current = state
  for (let guard = 0; guard < 40 && current.turn.pending?.type === 'DEBT'; guard++) {
    const action = getTimeoutAction(current)
    if (!action || action.type !== 'SELL') break
    plan.push(action)
    current = applyAction(current, action).state
  }
  return plan
}
