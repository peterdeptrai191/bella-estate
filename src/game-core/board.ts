import { BOARD, BOARD_SIZE, type BoardSide, type ColorGroupId, type TileDef, type TileKind } from '../config/board'
import { ECONOMY } from '../config/economy'

function indexOfKind(kind: TileKind): number {
  const i = BOARD.findIndex((t) => t.kind === kind)
  if (i < 0) throw new Error(`Bàn cờ thiếu ô ${kind}`)
  return i
}

export const START_INDEX = indexOfKind('START')
export const ISLAND_INDEX = indexOfKind('ISLAND')
export const FESTIVAL_INDEX = indexOfKind('FESTIVAL')
export const AIRPORT_INDEX = indexOfKind('AIRPORT')

/** Cấp Landmark (sau maxHouses nhà). */
export const LANDMARK_LEVEL = ECONOMY.city.maxHouses + 1

export const CITY_INDICES = BOARD.filter((t) => t.kind === 'CITY').map((t) => t.index)
export const RESORT_INDICES = BOARD.filter((t) => t.kind === 'RESORT').map((t) => t.index)

export function isValidTileIndex(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < BOARD_SIZE
}

export function tileDef(i: number): TileDef {
  const def = BOARD[i]
  if (!def) throw new Error(`Ô ${i} không tồn tại`)
  return def
}

export function isPurchasable(i: number): boolean {
  const kind = tileDef(i).kind
  return kind === 'CITY' || kind === 'RESORT'
}

export function groupTiles(group: ColorGroupId): number[] {
  return BOARD.filter((t) => t.group === group).map((t) => t.index)
}

export function sidePurchasableTiles(side: BoardSide): number[] {
  return BOARD.filter((t) => t.side === side && isPurchasable(t.index)).map((t) => t.index)
}

export const SIDES: readonly BoardSide[] = [0, 1, 2, 3]
