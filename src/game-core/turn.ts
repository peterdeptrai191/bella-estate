/** Chuyển lượt, đếm vòng, kết thúc ván. */
import { ECONOMY } from '../config/economy'
import { type Ctx, emit } from './context'
import type { PlayerId, TurnState, WinReason } from './types'
import { standings } from './valuation'

export function freshTurn(): TurnState {
  return {
    step: 'ROLL',
    dice: null,
    doublesCount: 0,
    extraRoll: false,
    pending: null,
    buildTile: null,
    acquiredTile: null,
    buyoutTile: null,
    freeHouse: false,
    festivalChoice: false,
  }
}

export function finishGame(ctx: Ctx, winner: PlayerId, reason: WinReason): void {
  const s = ctx.s
  s.phase = 'finished'
  s.winner = winner
  s.winReason = reason
  emit(ctx, { type: 'GAME_OVER', winner, reason, standings: standings(s) })
}

/** Chuyển sang người chơi kế tiếp còn trong ván. Hết vòng cuối thì kết thúc theo tổng tài sản. */
export function advanceTurn(ctx: Ctx): void {
  const s = ctx.s
  let i = s.currentPlayerIndex
  let wrapped = false
  do {
    i++
    if (i >= s.players.length) {
      i = 0
      wrapped = true
    }
  } while (s.players[i].bankrupt)

  if (wrapped) s.round++
  // Ván cũ (lưu trước khi có tuỳ chọn số vòng) không có maxRounds: dùng mặc định.
  const limit = s.maxRounds || ECONOMY.maxRounds
  if (s.round > limit) {
    s.round = limit
    finishGame(ctx, standings(s)[0].playerId, 'ROUND_LIMIT')
    return
  }
  s.currentPlayerIndex = i
  s.turn = freshTurn()
  emit(ctx, { type: 'TURN_STARTED', playerId: s.players[i].id, round: s.round })
}
