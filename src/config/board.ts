/**
 * Dữ liệu bàn cờ 32 ô — theo docs/GDD.md mục 3 và 4. Dữ liệu thuần.
 *
 * Bố cục: 4 cạnh, mỗi cạnh = 1 ô góc + 7 ô. Mỗi cạnh có 5 thành phố, 1 Khu Du Lịch
 * và 1 ô đặc biệt (3 cạnh có Cơ Hội, cạnh cuối có Thuế).
 * Giá lấy từ economy.ts để chỉ có một nguồn sự thật.
 */
import { ECONOMY } from './economy'

export type ColorGroupId = 'brown' | 'lightBlue' | 'pink' | 'orange' | 'red' | 'yellow' | 'darkBlue'
export type TileKind = 'START' | 'ISLAND' | 'FESTIVAL' | 'AIRPORT' | 'CITY' | 'RESORT' | 'CHANCE' | 'TAX'
export type BoardSide = 0 | 1 | 2 | 3

export interface ColorGroupDef {
  id: ColorGroupId
  name: string
  /** Màu pastel cho đồ họa (chuỗi hex). */
  color: string
  premium: boolean
}

export const COLOR_GROUPS: readonly ColorGroupDef[] = [
  { id: 'brown', name: 'Nâu', color: '#c49a7a', premium: false },
  { id: 'lightBlue', name: 'Xanh nhạt', color: '#9fd8f0', premium: false },
  { id: 'pink', name: 'Hồng', color: '#f4a6c8', premium: false },
  { id: 'orange', name: 'Cam', color: '#f7b77a', premium: false },
  { id: 'red', name: 'Đỏ', color: '#ef8a8a', premium: false },
  { id: 'yellow', name: 'Vàng', color: '#f6dc78', premium: false },
  { id: 'darkBlue', name: 'Xanh đậm', color: '#6f8fd8', premium: true },
]

export interface TileDef {
  index: number
  kind: TileKind
  name: string
  /** Cạnh bàn cờ 0..3. Ô góc là ô đầu tiên của cạnh. */
  side: BoardSide
  /** Vị trí trong cạnh: 0 = ô góc, 1..7 = các ô còn lại. */
  sideIndex: number
  /** Nhóm màu (chỉ thành phố). */
  group: ColorGroupId | null
  /** Giá mua (thành phố, Khu Du Lịch); null với ô không mua được. */
  price: number | null
}

export const BOARD_SIZE = 32
export const TILES_PER_SIDE = 8

type SpecialKind = 'START' | 'ISLAND' | 'FESTIVAL' | 'AIRPORT' | 'CHANCE' | 'TAX'
type Slot = SpecialKind | 'RESORT' | ColorGroupId

const SPECIAL_NAMES: Record<SpecialKind, string> = {
  START: 'Xuất Phát',
  ISLAND: 'Đảo Hoang',
  FESTIVAL: 'Lễ Hội',
  AIRPORT: 'Sân Bay',
  CHANCE: 'Cơ Hội',
  TAX: 'Thuế',
}

// prettier-ignore
const LAYOUT: readonly Slot[] = [
  // Cạnh 0: ô 0–7
  'START',    'brown',  'brown',  'CHANCE', 'brown',  'RESORT', 'lightBlue', 'lightBlue',
  // Cạnh 1: ô 8–15
  'ISLAND',   'lightBlue', 'pink', 'pink',  'RESORT', 'pink',   'CHANCE',    'orange',
  // Cạnh 2: ô 16–23
  'FESTIVAL', 'orange', 'orange', 'CHANCE', 'red',    'red',    'RESORT',    'red',
  // Cạnh 3: ô 24–31
  'AIRPORT',  'yellow', 'yellow', 'RESORT', 'yellow', 'TAX',    'darkBlue',  'darkBlue',
]

function isSpecial(slot: Slot): slot is SpecialKind {
  return slot in SPECIAL_NAMES
}

function buildBoard(): TileDef[] {
  let cityCount = 0
  let resortCount = 0
  return LAYOUT.map((slot, index) => {
    const base = {
      index,
      side: Math.floor(index / TILES_PER_SIDE) as BoardSide,
      sideIndex: index % TILES_PER_SIDE,
    }
    if (isSpecial(slot)) {
      return { ...base, kind: slot, name: SPECIAL_NAMES[slot], group: null, price: null }
    }
    if (slot === 'RESORT') {
      resortCount++
      return { ...base, kind: 'RESORT', name: `Khu Du Lịch ${resortCount}`, group: null, price: ECONOMY.resort.price }
    }
    cityCount++
    return { ...base, kind: 'CITY', name: `Thành phố ${cityCount}`, group: slot, price: ECONOMY.groupPrices[slot] }
  })
}

export const BOARD: readonly TileDef[] = buildBoard()
