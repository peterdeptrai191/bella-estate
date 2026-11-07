/** Di chuyển quân cờ và xử lý ô vừa dừng. */
import { BOARD_SIZE } from '../config/board'
import { ECONOMY } from '../config/economy'
import { CITY_INDICES, ISLAND_INDEX, tileDef } from './board'
import { type Ctx, currentPlayer, emit } from './context'
import { charge } from './money'
import type { Player } from './types'
import { netWorth, rentFor } from './valuation'

type MoveMode = 'WALK' | 'FLY' | 'TELEPORT'

/** Số nhà tối đa người chơi được có trên một thành phố: vòng đầu 2, từ vòng 2 (đã qua Xuất Phát) 3. */
export function houseCap(player: Pick<Player, 'passedStart'>): number {
  return player.passedStart ? ECONOMY.city.maxHouses : ECONOMY.city.firstLapMaxHouses
}

/** Đi tiến `steps` ô. Đi qua hoặc dừng đúng Xuất Phát được thưởng. */
export function walk(ctx: Ctx, steps: number, mode: MoveMode): void {
  const player = currentPlayer(ctx.s)
  const from = player.position
  const raw = from + steps
  const to = raw % BOARD_SIZE
  player.position = to
  emit(ctx, { type: 'PLAYER_MOVED', playerId: player.id, from, to, steps, mode })
  if (raw >= BOARD_SIZE) {
    player.money += ECONOMY.passStartBonus
    player.passedStart = true
    emit(ctx, { type: 'PASSED_START', playerId: player.id, amount: ECONOMY.passStartBonus })
  }
}

/** Đi tiến tới ô `target` (luôn theo chiều kim đồng hồ). */
export function moveTo(ctx: Ctx, target: number, mode: MoveMode): void {
  const from = currentPlayer(ctx.s).position
  const steps = (target - from + BOARD_SIZE) % BOARD_SIZE || BOARD_SIZE
  walk(ctx, steps, mode)
}

export function sendToIsland(ctx: Ctx, reason: 'THREE_DOUBLES' | 'TILE' | 'CARD'): void {
  const player = currentPlayer(ctx.s)
  const from = player.position
  player.position = ISLAND_INDEX
  player.islandTurnsLeft = ECONOMY.island.maxTurns
  player.airportTicket = false
  ctx.s.turn.extraRoll = false
  if (from !== ISLAND_INDEX) {
    emit(ctx, { type: 'PLAYER_MOVED', playerId: player.id, from, to: ISLAND_INDEX, steps: 0, mode: 'TELEPORT' })
  }
  emit(ctx, { type: 'SENT_TO_ISLAND', playerId: player.id, reason })
}

/** Xử lý ô người chơi hiện tại vừa dừng. */
export function landOn(ctx: Ctx): void {
  const s = ctx.s
  const t = s.turn
  const player = currentPlayer(s)
  const i = player.position
  const def = tileDef(i)

  t.buildTile = null
  t.acquiredTile = null
  t.arrivalLevel = null
  t.buyoutTile = null
  t.freeHouse = false
  t.festivalChoice = false

  switch (def.kind) {
    case 'START': {
      const canUpgrade = CITY_INDICES.some(
        (c) => s.tiles[c].owner === player.id && s.tiles[c].level < houseCap(player),
      )
      if (canUpgrade) {
        t.freeHouse = true
        emit(ctx, { type: 'FREE_HOUSE_AVAILABLE', playerId: player.id })
      }
      return
    }
    case 'ISLAND':
      sendToIsland(ctx, 'TILE')
      return
    case 'FESTIVAL':
      t.festivalChoice = CITY_INDICES.some((c) => s.tiles[c].owner === player.id)
      return
    case 'AIRPORT':
      player.airportTicket = true
      t.extraRoll = false
      emit(ctx, { type: 'AIRPORT_TICKET', playerId: player.id })
      return
    case 'CHANCE':
      t.pending = { type: 'DRAW_CARD' }
      return
    case 'TAX':
      charge(ctx, [{ to: null, amount: Math.floor(netWorth(s, player.id) * ECONOMY.taxRate) }], 'TAX')
      return
    case 'CITY':
    case 'RESORT': {
      const owner = s.tiles[i].owner
      if (owner === null) return
      if (owner === player.id) {
        if (def.kind === 'CITY') {
          t.buildTile = i
          t.arrivalLevel = s.tiles[i].level
        }
        return
      }
      const amount = rentFor(s, i)
      t.pending = { type: 'RENT', tileIndex: i, to: owner, amount }
      emit(ctx, { type: 'RENT_DUE', from: player.id, to: owner, tileIndex: i, amount })
      return
    }
  }
}
