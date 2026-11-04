/**
 * Ước lượng thời gian client cần để phát animation cho một loạt event, để server chờ đủ lâu
 * trước khi cho bot đi tiếp hoặc bắt đầu tính giờ lượt của người chơi.
 * Thông số lấy thẳng từ config/visual.ts (dữ liệu thuần, dùng chung với client).
 */
import { VISUAL } from '../config/visual'
import type { GameEvent } from '../game-core'

const a = VISUAL.animation
const coins = a.coinDuration + a.coinCount * a.coinStagger

export function eventSeconds(event: GameEvent): number {
  switch (event.type) {
    case 'TURN_STARTED':
      return a.turnPause
    case 'DICE_ROLLED':
      return a.diceRise + a.diceFall + a.diceBounce
    case 'PLAYER_MOVED':
      return event.mode === 'WALK' ? event.steps * a.hopDuration : event.mode === 'FLY' ? a.flyDuration : a.teleportDuration
    case 'PASSED_START':
    case 'RENT_PAID':
    case 'MONEY_PAID':
    case 'MONEY_RECEIVED':
      return coins
    case 'BOUGHT_OUT':
      return coins + a.buildDuration
    case 'PROPERTY_BOUGHT':
    case 'BUILT':
      return a.buildDuration
    case 'CARD_DRAWN':
      return a.cardRevealBot
    case 'DEBT_STARTED':
    case 'EXTRA_ROLL':
      return a.cardPause
    case 'FESTIVAL_HOSTED':
    case 'HOUSE_DESTROYED':
    case 'PROPERTY_SOLD':
    case 'RENT_WAIVED':
      return a.cardPause / 2
    case 'BANKRUPT':
      return a.teleportDuration
    default:
      return 0
  }
}

/** Tổng thời gian (ms) cho cả loạt event, cộng khoảng nghỉ giữa các event và 15% dự phòng. */
export function animationMs(events: readonly GameEvent[]): number {
  const seconds = events.reduce((sum, e) => sum + eventSeconds(e) + a.eventGap, 0)
  return Math.round(seconds * 1.15 * 1000)
}
