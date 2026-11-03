/** Các phép tính giá trị: tiền thuê, giá trị đầu tư, giá mua lại, giá bán, tổng tài sản. */
import { COLOR_GROUPS, type ColorGroupId } from '../config/board'
import { ECONOMY } from '../config/economy'
import { CITY_INDICES, LANDMARK_LEVEL, RESORT_INDICES, groupTiles, tileDef } from './board'
import type { GameState, PlayerId, Standing } from './types'

export function landPrice(i: number): number {
  const price = tileDef(i).price
  if (price === null) throw new Error(`Ô ${i} không mua được`)
  return price
}

/** Chi phí để nâng thành phố lên cấp `level` (1..4). */
export function buildCost(i: number, level: number): number {
  return Math.round(landPrice(i) * ECONOMY.city.buildCostRatio[level])
}

/** Tổng đã đầu tư vào ô (đất + nhà/Landmark). 0 nếu chưa có chủ. */
export function investedValue(s: GameState, i: number): number {
  const tile = s.tiles[i]
  if (!tile.owner) return 0
  if (tileDef(i).kind === 'RESORT') return landPrice(i)
  let total = 0
  for (let level = 0; level <= tile.level; level++) {
    total += Math.round(landPrice(i) * ECONOMY.city.buildCostRatio[level])
  }
  return total
}

/** Giá bán cho ngân hàng (50% giá trị đầu tư). */
export function sellValue(s: GameState, i: number): number {
  return Math.floor(investedValue(s, i) * ECONOMY.bankSellRatio)
}

/** Giá mua lại (2x giá trị đầu tư). */
export function buyoutPrice(s: GameState, i: number): number {
  return investedValue(s, i) * ECONOMY.buyoutMultiplier
}

export function ownedTiles(s: GameState, playerId: PlayerId): number[] {
  return s.tiles.flatMap((t, i) => (t.owner === playerId ? [i] : []))
}

export function ownsWholeGroup(s: GameState, playerId: PlayerId, group: ColorGroupId): boolean {
  return groupTiles(group).every((i) => s.tiles[i].owner === playerId)
}

export function completedGroups(s: GameState, playerId: PlayerId): ColorGroupId[] {
  return COLOR_GROUPS.map((g) => g.id).filter((g) => ownsWholeGroup(s, playerId, g))
}

export function resortCount(s: GameState, playerId: PlayerId): number {
  return RESORT_INDICES.filter((i) => s.tiles[i].owner === playerId).length
}

/** Tiền thuê hiện tại khi dừng ở ô `i` (chưa tính thẻ Giảm Giá). */
export function rentFor(s: GameState, i: number): number {
  const tile = s.tiles[i]
  if (!tile.owner) return 0
  const def = tileDef(i)
  if (def.kind === 'RESORT') return ECONOMY.resort.rentByCount[resortCount(s, tile.owner)]
  let rent = Math.round(landPrice(i) * ECONOMY.city.rentRatio[tile.level])
  if (def.group && ownsWholeGroup(s, tile.owner, def.group)) rent *= ECONOMY.colorGroupRentMultiplier
  if (s.festivalTile === i) rent *= ECONOMY.festivalRentMultiplier
  return rent
}

/** Số căn nhà đang sở hữu (Landmark tính là đủ số nhà tối đa). */
export function housesOwned(s: GameState, playerId: PlayerId): number {
  return CITY_INDICES.filter((i) => s.tiles[i].owner === playerId).reduce(
    (sum, i) => sum + Math.min(s.tiles[i].level, ECONOMY.city.maxHouses),
    0,
  )
}

export function isLandmark(s: GameState, i: number): boolean {
  return s.tiles[i].level >= LANDMARK_LEVEL
}

export function liquidationValue(s: GameState, playerId: PlayerId): number {
  return ownedTiles(s, playerId).reduce((sum, i) => sum + sellValue(s, i), 0)
}

/** Tổng tài sản = tiền mặt + tổng giá trị đã đầu tư. */
export function netWorth(s: GameState, playerId: PlayerId): number {
  const player = s.players.find((p) => p.id === playerId)
  if (!player) throw new Error(`Không có người chơi ${playerId}`)
  return player.money + ownedTiles(s, playerId).reduce((sum, i) => sum + investedValue(s, i), 0)
}

/** Bảng xếp hạng: người còn chơi trước, tổng tài sản giảm dần, hòa thì nhiều tiền mặt hơn. */
export function standings(s: GameState): Standing[] {
  return s.players
    .map((p) => ({ playerId: p.id, netWorth: netWorth(s, p.id), money: p.money, bankrupt: p.bankrupt }))
    .sort(
      (a, b) =>
        Number(a.bankrupt) - Number(b.bankrupt) || b.netWorth - a.netWorth || b.money - a.money,
    )
}
