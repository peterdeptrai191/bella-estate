/**
 * Bot AI mức "Thường" — docs/GDD.md mục 7: ưu tiên gom trọn nhóm màu, luôn giữ lại ít nhất
 * `BOTS.normal.cashReserve` tiền mặt. Hàm thuần, không ngẫu nhiên: cùng state → cùng quyết định,
 * nên chạy được y nguyên trên server.
 */
import { BOTS } from '../config/bots'
import { ECONOMY } from '../config/economy'
import { LANDMARK_LEVEL, groupTiles, tileDef } from './board'
import { currentPlayer } from './context'
import { getLegalActions } from './legalActions'
import type { GameAction, GameState, PlayerId } from './types'
import { buildCost, buyoutPrice, completedGroups, landPrice, netWorth, rentFor, sellValue } from './valuation'

const CFG = BOTS.normal

type Of<K extends GameAction['type']> = Extract<GameAction, { type: K }>

/** Sau khi có thêm ô `i`, người chơi sở hữu bao nhiêu ô trong nhóm màu của nó (và nhóm có mấy ô). */
function groupProgress(s: GameState, playerId: PlayerId, i: number): { owned: number; size: number } {
  const group = tileDef(i).group
  if (!group) return { owned: 0, size: 0 }
  const tiles = groupTiles(group)
  const owned = tiles.filter((t) => t === i || s.tiles[t].owner === playerId).length
  return { owned, size: tiles.length }
}

function completesGroup(s: GameState, playerId: PlayerId, i: number): boolean {
  const { owned, size } = groupProgress(s, playerId, i)
  return size > 0 && owned === size
}

/** Ước lượng tiền thuê của thành phố ở cấp `level` (không tính hệ số) — dùng để so sánh các ô. */
function baseRent(i: number, level: number): number {
  return landPrice(i) * ECONOMY.city.rentRatio[Math.min(level, LANDMARK_LEVEL)]
}

function pickMax<T>(items: T[], score: (item: T) => number): T | undefined {
  let best: T | undefined
  let bestScore = -Infinity
  for (const item of items) {
    const v = score(item)
    if (v > bestScore) {
      best = item
      bestScore = v
    }
  }
  return best
}

export function chooseBotAction(state: GameState): GameAction | null {
  const legal = getLegalActions(state)
  if (legal.length === 0) return null
  if (legal.length === 1) return legal[0]

  const s = state
  const me = currentPlayer(s)
  const of = <K extends GameAction['type']>(type: K) => legal.filter((a): a is Of<K> => a.type === type)
  const reserve = CFG.cashReserve
  const pending = s.turn.pending

  // --- Việc bắt buộc ---
  if (pending?.type === 'RENT') {
    return of('USE_CARD').find((a) => a.card === 'SHIELD') ?? of('PAY_RENT')[0] ?? legal[0]
  }
  if (pending?.type === 'DEBT') return chooseSale(s, of('SELL')) ?? legal[0]
  if (pending?.type === 'EARTHQUAKE') {
    // Phá nhà của đối thủ giàu nhất, ưu tiên ô có tiền thuê cao.
    return (
      pickMax(of('EARTHQUAKE'), (a) => {
        const owner = s.tiles[a.tileIndex].owner
        return (owner ? netWorth(s, owner) : 0) * 10 + rentFor(s, a.tileIndex)
      }) ?? legal[0]
    )
  }
  if (pending?.type === 'DRAW_CARD') return of('DRAW_CARD')[0] ?? legal[0]

  // --- Đầu lượt ---
  if (s.turn.step === 'ROLL') {
    const escape = of('USE_CARD').find((a) => a.card === 'ESCAPE_ISLAND')
    if (escape) return escape
    const fee = of('PAY_ISLAND_FEE')[0]
    if (fee && me.money - ECONOMY.island.escapeFee >= reserve * CFG.islandFeeReserveFactor) return fee
    const flight = chooseFlight(s, me.id, me.money - ECONOMY.airport.flightFee, of('FLY'))
    if (flight) return flight
    return of('ROLL_DICE')[0] ?? legal[0]
  }
  if (s.turn.step === 'MOVE') return of('MOVE')[0] ?? legal[0]

  // --- Bước hành động ---
  const festival = pickMax(of('HOST_FESTIVAL'), (a) => baseRent(a.tileIndex, s.tiles[a.tileIndex].level))
  if (festival) return festival

  const buy = of('BUY')[0]
  if (buy && me.money - landPrice(me.position) >= reserve) return buy

  const buyout = of('BUYOUT')[0]
  if (buyout) {
    const i = me.position
    const price = buyoutPrice(s, i)
    const { owned } = groupProgress(s, me.id, i)
    const worthIt = completesGroup(s, me.id, i) || (owned >= 2 && me.money - price >= reserve * 2)
    if (worthIt && me.money - price >= reserve) return buyout
  }

  const builds = of('BUILD')
  if (builds.length > 0) {
    if (s.turn.freeHouse) {
      const done = new Set(completedGroups(s, me.id))
      const best = pickMax(builds, (a) => {
        const group = tileDef(a.tileIndex).group
        return (group && done.has(group) ? 1e6 : 0) + landPrice(a.tileIndex)
      })
      if (best) return best
    } else {
      const build = builds[0]
      const cost = buildCost(build.tileIndex, s.tiles[build.tileIndex].level + 1)
      if (me.money - cost >= reserve * CFG.buildReserveFactor) return build
    }
  }

  return of('END_TURN')[0] ?? legal[0]
}

/** Bán ô ít giá trị chiến lược nhất: tránh phá nhóm màu đã gom đủ; ưu tiên một ô vừa đủ trả nợ. */
function chooseSale(s: GameState, sells: Of<'SELL'>[]): GameAction | undefined {
  if (sells.length === 0) return undefined
  const me = currentPlayer(s)
  const pending = s.turn.pending
  const due = pending?.type === 'DEBT' ? pending.payments.reduce((sum, p) => sum + p.amount, 0) : 0
  const missing = due - me.money
  const done = new Set(completedGroups(s, me.id))
  const inDoneGroup = (i: number) => {
    const group = tileDef(i).group
    return group !== null && done.has(group)
  }
  const loose = sells.filter((a) => !inDoneGroup(a.tileIndex))
  const pool = loose.length > 0 ? loose : sells
  const enough = pool.filter((a) => sellValue(s, a.tileIndex) >= missing)
  if (enough.length > 0) return pickMax(enough, (a) => -sellValue(s, a.tileIndex))
  return pickMax(pool, (a) => sellValue(s, a.tileIndex))
}

/** Bay tới ô trống giúp gom nhóm màu, hoặc về thành phố của mình để xây; không có ô đáng bay thì tung xúc xắc. */
function chooseFlight(s: GameState, me: PlayerId, budget: number, flights: Of<'FLY'>[]): GameAction | undefined {
  if (flights.length === 0 || budget < CFG.cashReserve) return undefined
  let best: GameAction | undefined
  let bestScore = 0
  for (const a of flights) {
    const i = a.tileIndex
    const def = tileDef(i)
    const tile = s.tiles[i]
    let score = 0
    if (tile.owner === null && def.price !== null && budget - def.price >= CFG.cashReserve) {
      const { owned, size } = groupProgress(s, me, i)
      score = def.kind === 'CITY' ? (owned === size ? 100 : owned * 20) + def.price / 100 : 10
    } else if (tile.owner === me && def.kind === 'CITY' && tile.level < LANDMARK_LEVEL) {
      const cost = buildCost(i, tile.level + 1)
      if (budget - cost >= CFG.cashReserve * CFG.buildReserveFactor) score = 15 + (def.price ?? 0) / 100
    }
    if (score > bestScore) {
      bestScore = score
      best = a
    }
  }
  return best
}
