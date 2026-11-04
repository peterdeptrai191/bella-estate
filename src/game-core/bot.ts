/**
 * Bot AI 3 mức — docs/GDD.md mục 7. Hàm thuần: cùng state + cùng mức → cùng quyết định, nên chạy được
 * y nguyên trên server. Mức Dễ cần "ngẫu nhiên" thì lấy từ trạng thái RNG trong state (không đụng RNG thật).
 */
import { BOTS, type BotLevel } from '../config/bots'
import { ECONOMY } from '../config/economy'
import { LANDMARK_LEVEL, RESORT_INDICES, SIDES, groupTiles, sidePurchasableTiles, tileDef } from './board'
import { currentPlayer } from './context'
import { getLegalActions } from './legalActions'
import { nextRandom } from './rng'
import type { GameAction, GameState, PlayerId } from './types'
import { buildCost, buyoutPrice, completedGroups, landPrice, netWorth, rentFor, sellValue } from './valuation'

export type { BotLevel }

type Of<K extends GameAction['type']> = Extract<GameAction, { type: K }>

// ---------- Hàm đánh giá dùng chung ----------

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

const opponents = (s: GameState, me: PlayerId) => s.players.filter((p) => p.id !== me && !p.bankrupt)

/**
 * Nếu đối thủ có ô `i` (hoặc ô `i` còn trống mà đối thủ chiếm được) thì họ có tiến sát chiến thắng không?
 * Trả về mức đe dọa 0..1: 1 = có ô này là thắng ngay (gom đủ nhóm thứ 3, cạnh bàn cờ, đủ 4 khu du lịch).
 */
function threatIfOpponentGets(s: GameState, me: PlayerId, i: number): number {
  let worst = 0
  for (const opp of opponents(s, me)) {
    const has = (t: number) => t === i || s.tiles[t].owner === opp.id
    const def = tileDef(i)
    // Nhóm màu: ô này giúp họ gom trọn nhóm.
    if (def.group) {
      const tiles = groupTiles(def.group)
      if (tiles.every(has)) {
        const groupsAfter = completedGroups(s, opp.id).length + (completedGroups(s, opp.id).includes(def.group) ? 0 : 1)
        worst = Math.max(worst, groupsAfter >= ECONOMY.win.colorGroupsToWin ? 1 : 0.6)
      } else if (tiles.filter(has).length === tiles.length - 1) {
        worst = Math.max(worst, 0.25)
      }
    }
    // Cạnh bàn cờ.
    for (const side of SIDES) {
      const tiles = sidePurchasableTiles(side)
      if (!tiles.includes(i)) continue
      const count = tiles.filter(has).length
      if (count === tiles.length) worst = Math.max(worst, 1)
      else if (count === tiles.length - 1) worst = Math.max(worst, 0.5)
    }
    // Khu du lịch.
    if (def.kind === 'RESORT') {
      const count = RESORT_INDICES.filter(has).length
      if (count === RESORT_INDICES.length) worst = Math.max(worst, 1)
      else if (count === RESORT_INDICES.length - 1) worst = Math.max(worst, 0.5)
    }
  }
  return worst
}

/** Tiền thuê lớn nhất của đối thủ hiện có — kỳ vọng xấu nhất phải trả khi đi một vòng. */
function worstRentAhead(s: GameState, me: PlayerId): number {
  let worst = 0
  s.tiles.forEach((t, i) => {
    if (t.owner && t.owner !== me) worst = Math.max(worst, rentFor(s, i))
  })
  return worst
}

/** "Ngẫu nhiên" tất định cho bot Dễ: suy từ RNG trong state + ngữ cảnh quyết định. */
function botRoll(s: GameState, salt: number): number {
  const seed = (s.rngState ^ Math.imul(salt + 1, 0x9e3779b1) ^ Math.imul(s.round, 0x85ebca6b)) | 0
  return nextRandom(seed)[0]
}

// ---------- Việc bắt buộc (cả 3 mức gần giống nhau) ----------

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

function forced(s: GameState, legal: GameAction[], level: BotLevel): GameAction | undefined {
  const of = <K extends GameAction['type']>(type: K) => legal.filter((a): a is Of<K> => a.type === type)
  const me = currentPlayer(s)
  switch (s.turn.pending?.type) {
    case 'RENT':
      return of('USE_CARD').find((a) => a.card === 'SHIELD') ?? of('PAY_RENT')[0]
    case 'DEBT':
      return level === 'easy' ? pickMax(of('SELL'), (a) => -sellValue(s, a.tileIndex)) : chooseSale(s, of('SELL'))
    case 'DRAW_CARD':
      return of('DRAW_CARD')[0]
    case 'EARTHQUAKE':
      return pickMax(of('EARTHQUAKE'), (a) => {
        const owner = s.tiles[a.tileIndex].owner
        if (level === 'easy') return -a.tileIndex
        const threat = owner ? threatIfOpponentGets(s, me.id, a.tileIndex) : 0
        return (level === 'hard' ? threat * 1e6 : 0) + (owner ? netWorth(s, owner) : 0) * 10 + rentFor(s, a.tileIndex)
      })
  }
  if (s.turn.step === 'MOVE') return of('MOVE')[0]
  return undefined
}

// ---------- Từng mức ----------

function easyBot(s: GameState, legal: GameAction[]): GameAction {
  const of = <K extends GameAction['type']>(type: K) => legal.filter((a): a is Of<K> => a.type === type)
  const me = currentPlayer(s)
  const cfg = BOTS.easy
  if (s.turn.step === 'ROLL') {
    const escape = of('USE_CARD').find((a) => a.card === 'ESCAPE_ISLAND')
    if (escape) return escape
    return of('ROLL_DICE')[0] ?? legal[0]
  }
  const festival = of('HOST_FESTIVAL')[0]
  if (festival) return festival
  const buy = of('BUY')[0]
  if (buy && me.money - landPrice(me.position) >= cfg.cashReserve && botRoll(s, me.position * 7 + 1) < cfg.buyChance) return buy
  const buyout = of('BUYOUT')[0]
  if (buyout && me.money - buyoutPrice(s, me.position) >= cfg.cashReserve && botRoll(s, me.position * 7 + 2) < cfg.buyoutChance) {
    return buyout
  }
  const builds = of('BUILD')
  if (builds.length > 0) {
    if (s.turn.freeHouse) return builds[0]
    const build = builds[0]
    const level = s.tiles[build.tileIndex].level
    const cost = buildCost(build.tileIndex, level + 1)
    if (me.money - cost >= cfg.cashReserve && botRoll(s, build.tileIndex * 7 + level + 3) < cfg.buildChance) return build
  }
  return of('END_TURN')[0] ?? legal[0]
}

function normalBot(s: GameState, legal: GameAction[]): GameAction {
  const of = <K extends GameAction['type']>(type: K) => legal.filter((a): a is Of<K> => a.type === type)
  const me = currentPlayer(s)
  const cfg = BOTS.normal
  const reserve = cfg.cashReserve

  if (s.turn.step === 'ROLL') {
    const escape = of('USE_CARD').find((a) => a.card === 'ESCAPE_ISLAND')
    if (escape) return escape
    const fee = of('PAY_ISLAND_FEE')[0]
    if (fee && me.money - ECONOMY.island.escapeFee >= reserve * cfg.islandFeeReserveFactor) return fee
    const flight = chooseFlight(s, me.id, me.money - ECONOMY.airport.flightFee, of('FLY'), reserve, reserve * cfg.buildReserveFactor)
    if (flight) return flight
    return of('ROLL_DICE')[0] ?? legal[0]
  }

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
      if (me.money - cost >= reserve * cfg.buildReserveFactor) return build
    }
  }
  return of('END_TURN')[0] ?? legal[0]
}

function hardBot(s: GameState, legal: GameAction[]): GameAction {
  const of = <K extends GameAction['type']>(type: K) => legal.filter((a): a is Of<K> => a.type === type)
  const me = currentPlayer(s)
  const cfg = BOTS.hard
  // Giữ tiền bằng tiền thuê lớn nhất có thể phải trả (kỳ vọng xấu nhất), kẹp trong khoảng cấu hình.
  const reserve = Math.min(cfg.maxReserve, Math.max(cfg.minReserve, worstRentAhead(s, me.id)))
  const strategic = (i: number) => completesGroup(s, me.id, i) || threatIfOpponentGets(s, me.id, i) >= 0.5

  if (s.turn.step === 'ROLL') {
    const onIsland = me.islandTurnsLeft > 0
    if (onIsland) {
      // Đầu ván: thoát sớm để mua đất. Cuối ván: ở lại đảo cho an toàn.
      const early = s.round < cfg.leaveIslandBeforeRound
      const escape = of('USE_CARD').find((a) => a.card === 'ESCAPE_ISLAND')
      if (early && escape) return escape
      const fee = of('PAY_ISLAND_FEE')[0]
      if (early && fee && me.money - ECONOMY.island.escapeFee >= reserve) return fee
      return of('ROLL_DICE')[0] ?? legal[0]
    }
    const flight = chooseFlightHard(s, me.id, me.money - ECONOMY.airport.flightFee, of('FLY'), reserve)
    if (flight) return flight
    return of('ROLL_DICE')[0] ?? legal[0]
  }

  // Lễ Hội: thành phố có tiền thuê thực tế cao nhất.
  const festival = pickMax(of('HOST_FESTIVAL'), (a) => rentFor(s, a.tileIndex) + baseRent(a.tileIndex, s.tiles[a.tileIndex].level))
  if (festival) return festival

  const buy = of('BUY')[0]
  if (buy) {
    const i = me.position
    const left = me.money - landPrice(i)
    if (left >= (strategic(i) ? cfg.strategicReserve : reserve)) return buy
  }

  // Mua lại: gom trọn nhóm, hoặc phá thế sắp thắng của chủ ô.
  const buyout = of('BUYOUT')[0]
  if (buyout) {
    const i = me.position
    const left = me.money - buyoutPrice(s, i)
    const owner = s.tiles[i].owner
    const breaksThreat = owner !== null && breaksOwnerThreat(s, owner, i)
    if ((completesGroup(s, me.id, i) || breaksThreat) && left >= cfg.strategicReserve) return buyout
    if (groupProgress(s, me.id, i).owned >= 2 && left >= reserve * 2) return buyout
  }

  const builds = of('BUILD')
  if (builds.length > 0) {
    if (s.turn.freeHouse) {
      // Nhà miễn phí: đặt vào ô cho tiền thuê tăng nhiều nhất.
      const best = pickMax(builds, (a) => {
        const level = s.tiles[a.tileIndex].level
        const mult = completesGroupOwned(s, me.id, a.tileIndex) ? ECONOMY.colorGroupRentMultiplier : 1
        return (baseRent(a.tileIndex, level + 1) - baseRent(a.tileIndex, level)) * mult
      })
      if (best) return best
    } else {
      const build = builds[0]
      const cost = buildCost(build.tileIndex, s.tiles[build.tileIndex].level + 1)
      // Nhóm đã gom đủ (thuê x2) thì xây mạnh tay hơn.
      const need = completesGroupOwned(s, me.id, build.tileIndex) ? cfg.minReserve : reserve
      if (me.money - cost >= need) return build
    }
  }
  return of('END_TURN')[0] ?? legal[0]
}

/** Người chơi đã sở hữu trọn nhóm màu của ô `i`. */
function completesGroupOwned(s: GameState, playerId: PlayerId, i: number): boolean {
  const group = tileDef(i).group
  return group !== null && groupTiles(group).every((t) => s.tiles[t].owner === playerId)
}

/** Lấy ô `i` khỏi tay `owner` có làm họ mất nhóm màu đã gom / mất thế sắp độc quyền cạnh không. */
function breaksOwnerThreat(s: GameState, owner: PlayerId, i: number): boolean {
  if (completesGroupOwned(s, owner, i)) return completedGroups(s, owner).length >= ECONOMY.win.colorGroupsToWin - 1
  for (const side of SIDES) {
    const tiles = sidePurchasableTiles(side)
    if (tiles.includes(i) && tiles.filter((t) => s.tiles[t].owner === owner).length >= tiles.length - 1) return true
  }
  if (tileDef(i).kind === 'RESORT') return RESORT_INDICES.filter((t) => s.tiles[t].owner === owner).length >= RESORT_INDICES.length - 1
  return false
}

/** Bay tới ô trống giúp gom nhóm màu, hoặc về thành phố của mình để xây; không có ô đáng bay thì tung xúc xắc. */
function chooseFlight(
  s: GameState,
  me: PlayerId,
  budget: number,
  flights: Of<'FLY'>[],
  reserve: number,
  buildReserve: number,
): GameAction | undefined {
  if (flights.length === 0 || budget < reserve) return undefined
  return pickMax(
    flights.filter((a) => flightScore(s, me, a.tileIndex, budget, reserve, buildReserve) > 0),
    (a) => flightScore(s, me, a.tileIndex, budget, reserve, buildReserve),
  )
}

function flightScore(s: GameState, me: PlayerId, i: number, budget: number, reserve: number, buildReserve: number): number {
  const def = tileDef(i)
  const tile = s.tiles[i]
  if (tile.owner === null && def.price !== null && budget - def.price >= reserve) {
    const { owned, size } = groupProgress(s, me, i)
    return def.kind === 'CITY' ? (owned === size ? 100 : owned * 20) + def.price / 100 : 10
  }
  if (tile.owner === me && def.kind === 'CITY' && tile.level < LANDMARK_LEVEL) {
    const cost = buildCost(i, tile.level + 1)
    if (budget - cost >= buildReserve) return 15 + (def.price ?? 0) / 100
  }
  return 0
}

function chooseFlightHard(s: GameState, me: PlayerId, budget: number, flights: Of<'FLY'>[], reserve: number): GameAction | undefined {
  if (flights.length === 0 || budget < BOTS.hard.strategicReserve) return undefined
  return pickMax(
    flights.filter((a) => hardFlightScore(s, me, a.tileIndex, budget, reserve) > 0),
    (a) => hardFlightScore(s, me, a.tileIndex, budget, reserve),
  )
}

function hardFlightScore(s: GameState, me: PlayerId, i: number, budget: number, reserve: number): number {
  const def = tileDef(i)
  const tile = s.tiles[i]
  if (tile.owner === null && def.price !== null) {
    const block = threatIfOpponentGets(s, me, i)
    const left = budget - def.price
    if (completesGroup(s, me, i) && left >= BOTS.hard.strategicReserve) return 200
    if (block >= 0.5 && left >= BOTS.hard.strategicReserve) return 150 * block
    if (left >= reserve) return 20 + groupProgress(s, me, i).owned * 20
  }
  if (tile.owner === me && def.kind === 'CITY' && tile.level < LANDMARK_LEVEL) {
    const cost = buildCost(i, tile.level + 1)
    if (budget - cost >= reserve) return 30 + (completesGroupOwned(s, me, i) ? 60 : 0)
  }
  return 0
}

/** Quyết định của bot cho người đang tới lượt. null nếu ván đã kết thúc. */
export function chooseBotAction(state: GameState, level: BotLevel = 'normal'): GameAction | null {
  const legal = getLegalActions(state)
  if (legal.length === 0) return null
  if (legal.length === 1) return legal[0]
  const must = forced(state, legal, level)
  if (must) return must
  switch (level) {
    case 'easy':
      return easyBot(state, legal)
    case 'hard':
      return hardBot(state, legal)
    default:
      return normalBot(state, legal)
  }
}
