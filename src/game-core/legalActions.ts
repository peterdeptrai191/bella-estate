/**
 * Liệt kê action hợp lệ cho người đang tới lượt. Dùng cho UI (bật/tắt nút), bot, hết giờ, giả lập.
 * Mỗi ứng viên được kiểm bằng chính reducer nên luôn khớp luật.
 */
import { BOARD_SIZE } from '../config/board'
import { currentPlayer, GameRuleError } from './context'
import { applyAction } from './reducer'
import type { GameAction, GameState } from './types'
import { sellValue } from './valuation'

export function isLegal(state: GameState, action: GameAction): boolean {
  try {
    applyAction(state, action)
    return true
  } catch (error) {
    if (error instanceof GameRuleError) return false
    throw error
  }
}

function candidates(state: GameState): GameAction[] {
  const player = currentPlayer(state)
  const playerId = player.id
  const t = state.turn
  const tiles = Array.from({ length: BOARD_SIZE }, (_, i) => i)
  const owned = tiles.filter((i) => state.tiles[i].owner === playerId)

  switch (t.pending?.type) {
    case 'RENT':
      return [
        { type: 'PAY_RENT', playerId },
        { type: 'USE_CARD', playerId, card: 'SHIELD' },
      ]
    case 'DEBT':
      return owned.map((tileIndex) => ({ type: 'SELL', playerId, tileIndex }))
    case 'DRAW_CARD':
      return [{ type: 'DRAW_CARD', playerId }]
    case 'EARTHQUAKE':
      return tiles.map((tileIndex) => ({ type: 'EARTHQUAKE', playerId, tileIndex }))
  }

  switch (t.step) {
    case 'ROLL':
      return [
        { type: 'ROLL_DICE', playerId },
        { type: 'PAY_ISLAND_FEE', playerId },
        { type: 'USE_CARD', playerId, card: 'ESCAPE_ISLAND' },
        ...(player.airportTicket ? tiles.map((tileIndex): GameAction => ({ type: 'FLY', playerId, tileIndex })) : []),
      ]
    case 'MOVE':
      return [{ type: 'MOVE', playerId }]
    case 'ACT':
      return [
        { type: 'BUY', playerId },
        { type: 'BUYOUT', playerId },
        ...owned.map((tileIndex): GameAction => ({ type: 'BUILD', playerId, tileIndex })),
        ...(t.festivalChoice
          ? owned.map((tileIndex): GameAction => ({ type: 'HOST_FESTIVAL', playerId, tileIndex }))
          : []),
        { type: 'END_TURN', playerId },
      ]
  }
}

export function getLegalActions(state: GameState): GameAction[] {
  if (state.phase !== 'playing') return []
  return candidates(state).filter((action) => isLegal(state, action))
}

/**
 * Action mặc định khi hết 20 giây (GDD mục 2): tự tung, tự xử lý việc bắt buộc,
 * còn lựa chọn tùy ý thì bỏ qua.
 */
export function getTimeoutAction(state: GameState): GameAction | null {
  const legal = getLegalActions(state)
  if (legal.length === 0) return null
  const pick = (type: GameAction['type']) => legal.find((a) => a.type === type)
  const sells = legal.filter((a): a is Extract<GameAction, { type: 'SELL' }> => a.type === 'SELL')
  if (sells.length > 0) {
    // Bán tài sản rẻ nhất trước.
    return sells.reduce((best, a) => (sellValue(state, a.tileIndex) < sellValue(state, best.tileIndex) ? a : best))
  }
  return (
    pick('PAY_RENT') ??
    pick('DRAW_CARD') ??
    pick('EARTHQUAKE') ??
    pick('ROLL_DICE') ??
    pick('MOVE') ??
    pick('END_TURN') ??
    legal[0]
  )
}
