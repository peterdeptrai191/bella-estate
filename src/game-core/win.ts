/** Điều kiện thắng ngay (GDD mục 5). Điều kiện hết vòng nằm trong turn.ts. */
import { ECONOMY } from '../config/economy'
import { RESORT_INDICES, SIDES, sidePurchasableTiles } from './board'
import type { Ctx } from './context'
import { finishGame } from './turn'
import type { GameState, PlayerId, WinReason } from './types'
import { completedGroups } from './valuation'

export function findInstantWinner(s: GameState): { playerId: PlayerId; reason: WinReason } | null {
  const active = s.players.filter((p) => !p.bankrupt)
  if (active.length === 1) return { playerId: active[0].id, reason: 'LAST_SURVIVOR' }

  // Xét người đang tới lượt trước.
  const ordered = [...active].sort(
    (a, b) => Number(b.id === s.players[s.currentPlayerIndex].id) - Number(a.id === s.players[s.currentPlayerIndex].id),
  )
  for (const p of ordered) {
    if (completedGroups(s, p.id).length >= ECONOMY.win.colorGroupsToWin) {
      return { playerId: p.id, reason: 'THREE_COLOR_GROUPS' }
    }
    if (SIDES.some((side) => sidePurchasableTiles(side).every((i) => s.tiles[i].owner === p.id))) {
      return { playerId: p.id, reason: 'SIDE_MONOPOLY' }
    }
    if (RESORT_INDICES.every((i) => s.tiles[i].owner === p.id)) {
      return { playerId: p.id, reason: 'ALL_RESORTS' }
    }
  }
  return null
}

export function checkWin(ctx: Ctx): void {
  if (ctx.s.phase !== 'playing') return
  const win = findInstantWinner(ctx.s)
  if (win) finishGame(ctx, win.playerId, win.reason)
}
