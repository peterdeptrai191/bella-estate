/** Thanh toán, nợ (bắt buộc bán tài sản) và phá sản. */
import { type Ctx, currentPlayer, emit, playerById } from './context'
import { LANDMARK_LEVEL } from './board'
import { advanceTurn, finishGame } from './turn'
import type { DebtReason, Payment } from './types'
import { liquidationValue, ownedTiles, sellValue } from './valuation'

export type ChargeResult = 'PAID' | 'DEBT' | 'BANKRUPT'

function payAll(ctx: Ctx, payments: Payment[], reason: DebtReason, tileIndex: number | null, discounted: boolean) {
  const payer = currentPlayer(ctx.s)
  for (const { to, amount } of payments) {
    payer.money -= amount
    if (to) playerById(ctx.s, to).money += amount
    if (reason === 'RENT') {
      if (!to || tileIndex === null) throw new Error('Tiền thuê phải có người nhận và ô')
      emit(ctx, { type: 'RENT_PAID', from: payer.id, to, tileIndex, amount, discounted })
    } else {
      emit(ctx, { type: 'MONEY_PAID', from: payer.id, to, amount, reason })
    }
  }
}

/**
 * Người chơi hiện tại phải trả các khoản `payments`.
 * - Đủ tiền mặt: trả ngay.
 * - Thiếu nhưng bán tài sản (50%) đủ bù: chuyển sang trạng thái nợ, bắt buộc SELL.
 * - Bán hết vẫn không đủ: phá sản.
 */
export function charge(
  ctx: Ctx,
  payments: Payment[],
  reason: DebtReason,
  tileIndex: number | null = null,
  discounted = false,
): ChargeResult {
  const due = payments.filter((p) => p.amount > 0)
  const total = due.reduce((sum, p) => sum + p.amount, 0)
  if (total === 0) return 'PAID'
  const payer = currentPlayer(ctx.s)

  if (payer.money >= total) {
    payAll(ctx, due, reason, tileIndex, discounted)
    return 'PAID'
  }
  if (payer.money + liquidationValue(ctx.s, payer.id) >= total) {
    ctx.s.turn.pending = { type: 'DEBT', reason, payments: due, tileIndex, discounted }
    emit(ctx, { type: 'DEBT_STARTED', playerId: payer.id, amount: total, reason })
    return 'DEBT'
  }
  declareBankruptcy(ctx, due)
  return 'BANKRUPT'
}

/** Sau khi đã trả (hoặc được miễn) tiền thuê: được quyền mua lại nếu không phải Landmark. */
export function afterRent(ctx: Ctx, tileIndex: number): void {
  if (ctx.s.tiles[tileIndex].level < LANDMARK_LEVEL) ctx.s.turn.buyoutTile = tileIndex
}

/** Gọi sau mỗi lần SELL: nếu đã đủ tiền thì tự trả nợ. */
export function settleDebtIfPossible(ctx: Ctx): void {
  const pending = ctx.s.turn.pending
  if (pending?.type !== 'DEBT') return
  const total = pending.payments.reduce((sum, p) => sum + p.amount, 0)
  if (currentPlayer(ctx.s).money < total) return
  ctx.s.turn.pending = null
  payAll(ctx, pending.payments, pending.reason, pending.tileIndex, pending.discounted)
  if (pending.reason === 'RENT' && pending.tileIndex !== null) afterRent(ctx, pending.tileIndex)
}

/** Bán toàn bộ tài sản cho ngân hàng, trả được bao nhiêu thì trả, rồi rời ván. */
export function declareBankruptcy(ctx: Ctx, payments: Payment[]): void {
  const s = ctx.s
  const player = currentPlayer(s)
  const released = ownedTiles(s, player.id)
  for (const i of released) {
    player.money += sellValue(s, i)
    s.tiles[i] = { owner: null, level: 0 }
    if (s.festivalTile === i) s.festivalTile = null
  }
  for (const { to, amount } of payments) {
    const paid = Math.min(amount, player.money)
    if (paid <= 0) break
    player.money -= paid
    if (to) playerById(s, to).money += paid
    emit(ctx, { type: 'MONEY_PAID', from: player.id, to, amount: paid, reason: 'BANKRUPTCY' })
  }
  player.money = 0
  player.bankrupt = true
  player.heldCards = []
  player.rentDiscount = false
  player.airportTicket = false
  player.islandTurnsLeft = 0
  s.turn.pending = null
  emit(ctx, { type: 'BANKRUPT', playerId: player.id, releasedTiles: released })

  const survivors = s.players.filter((p) => !p.bankrupt)
  if (survivors.length === 1) {
    finishGame(ctx, survivors[0].id, 'LAST_SURVIVOR')
    return
  }
  advanceTurn(ctx)
}
