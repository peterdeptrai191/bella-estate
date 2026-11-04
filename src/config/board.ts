/**
 * Dữ liệu bàn cờ 32 ô, chủ đề "Vòng quanh thế giới" — theo docs/GDD.md mục 3 và 4. Dữ liệu thuần.
 *
 * Bố cục: 4 cạnh, mỗi cạnh = 1 ô góc + 7 ô. Mỗi cạnh có 5 thành phố, 1 Khu Du Lịch
 * và 1 ô đặc biệt (3 cạnh có Cơ Hội, cạnh cuối có Thuế). Giá thành phố tăng dần theo chiều đi,
 * mỗi nhóm màu là một khu vực trên thế giới. Giá lấy từ economy.ts để chỉ có một nguồn sự thật.
 */
import { ECONOMY } from './economy'

/** Định danh nhóm màu (giữ tên theo màu cho ổn định code; tên hiển thị là khu vực). */
export type ColorGroupId = 'brown' | 'lightBlue' | 'pink' | 'orange' | 'red' | 'yellow' | 'darkBlue'
export type TileKind = 'START' | 'ISLAND' | 'FESTIVAL' | 'AIRPORT' | 'CITY' | 'RESORT' | 'CHANCE' | 'TAX'
export type BoardSide = 0 | 1 | 2 | 3

export interface ColorGroupDef {
  id: ColorGroupId
  /** Tên khu vực hiển thị. */
  name: string
  /** Màu pastel cho đồ họa (chuỗi hex). */
  color: string
  premium: boolean
}

export const COLOR_GROUPS: readonly ColorGroupDef[] = [
  { id: 'brown', name: 'Châu Phi', color: '#C9A27E', premium: false },
  { id: 'lightBlue', name: 'Đông Nam Á', color: '#8FD3E8', premium: false },
  { id: 'pink', name: 'Nam Mỹ', color: '#F4A7C0', premium: false },
  { id: 'orange', name: 'Trung Đông', color: '#F7B267', premium: false },
  { id: 'red', name: 'Đông Á', color: '#EF6F6C', premium: false },
  { id: 'yellow', name: 'Châu Âu', color: '#F9D56E', premium: false },
  { id: 'darkBlue', name: 'Biểu tượng toàn cầu', color: '#5B7FDB', premium: true },
]

/** Màu của 4 Khu Du Lịch. */
export const RESORT_COLOR = '#4FC3A1'

export interface TileDef {
  index: number
  kind: TileKind
  name: string
  /** Mô tả ngắn hiển thị khi xem ô. */
  description: string
  /** Tên Landmark của thành phố (null với ô khác). */
  landmark: string | null
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

interface TileContent {
  slot: Slot
  name: string
  description: string
  landmark?: string
}

const CHANCE: TileContent = { slot: 'CHANCE', name: 'Cơ Hội', description: 'Rút một thẻ, may hay rủi tùy bạn!' }

// Thứ tự ô theo chiều đi.
const CONTENT: readonly TileContent[] = [
  // Cạnh 0: ô 0–7
  { slot: 'START', name: 'Xuất Phát', description: 'Mỗi lần đi qua nhận 200. Dừng đúng ô: được xây miễn phí 1 nhà' },
  { slot: 'brown', name: 'Cairo', landmark: 'Kim Tự Tháp Giza', description: 'Thành phố ngàn năm bên dòng sông Nile' },
  { slot: 'brown', name: 'Nairobi', landmark: 'Công viên Safari', description: 'Thủ đô của thế giới hoang dã' },
  CHANCE,
  { slot: 'brown', name: 'Cape Town', landmark: 'Núi Bàn', description: 'Nơi hai đại dương gặp nhau' },
  { slot: 'RESORT', name: 'Vịnh Hạ Long', description: 'Kỳ quan thiên nhiên với hàng nghìn đảo đá' },
  { slot: 'lightBlue', name: 'Jakarta', landmark: 'Đài tưởng niệm Monas', description: 'Đô thị sôi động của vạn đảo' },
  { slot: 'lightBlue', name: 'Bangkok', landmark: 'Chùa Wat Arun', description: 'Thành phố của những ngôi chùa vàng' },
  // Cạnh 1: ô 8–15
  { slot: 'ISLAND', name: 'Đảo Hoang', description: 'Bị kẹt tối đa 3 lượt. Tung đôi, trả 100 hoặc dùng thẻ để thoát' },
  { slot: 'lightBlue', name: 'Hà Nội', landmark: 'Tháp Rùa – Hồ Gươm', description: 'Nghìn năm văn hiến' },
  { slot: 'pink', name: 'Lima', landmark: 'Quảng trường Plaza Mayor', description: 'Kinh đô ẩm thực Nam Mỹ' },
  { slot: 'pink', name: 'Buenos Aires', landmark: 'Đài Obelisco', description: 'Thủ phủ của điệu tango' },
  { slot: 'RESORT', name: 'Maldives', description: 'Thiên đường biển xanh và nhà gỗ trên mặt nước' },
  { slot: 'pink', name: 'Rio de Janeiro', landmark: 'Tượng Chúa Cứu Thế', description: 'Thành phố của lễ hội Carnival' },
  CHANCE,
  { slot: 'orange', name: 'Doha', landmark: 'Bảo tàng Nghệ thuật Hồi giáo', description: 'Viên ngọc bên vịnh Ba Tư' },
  // Cạnh 2: ô 16–23
  { slot: 'FESTIVAL', name: 'Lễ Hội Thế Giới', description: 'Chọn một thành phố của bạn, tiền thuê x2' },
  { slot: 'orange', name: 'Istanbul', landmark: 'Hagia Sophia', description: 'Nơi giao thoa Á – Âu' },
  { slot: 'orange', name: 'Dubai', landmark: 'Tháp Burj Khalifa', description: 'Thành phố của những kỷ lục' },
  { slot: 'red', name: 'Thượng Hải', landmark: 'Tháp Minh Châu Phương Đông', description: 'Trung tâm tài chính phương Đông' },
  { slot: 'RESORT', name: 'Santorini', description: 'Những mái vòm trắng xanh bên biển Aegean' },
  { slot: 'red', name: 'Seoul', landmark: 'Tháp N Seoul', description: 'Thủ đô của làn sóng Hallyu' },
  CHANCE,
  { slot: 'red', name: 'Tokyo', landmark: 'Tháp Tokyo', description: 'Nơi truyền thống gặp tương lai' },
  // Cạnh 3: ô 24–31
  { slot: 'AIRPORT', name: 'Sân Bay Quốc Tế', description: 'Lượt sau bay tới bất kỳ ô nào với giá 100' },
  { slot: 'yellow', name: 'Rome', landmark: 'Đấu trường Colosseum', description: 'Thành phố vĩnh cửu' },
  { slot: 'yellow', name: 'Berlin', landmark: 'Cổng Brandenburg', description: 'Trái tim của châu Âu hiện đại' },
  { slot: 'yellow', name: 'Paris', landmark: 'Tháp Eiffel', description: 'Kinh đô ánh sáng' },
  { slot: 'RESORT', name: 'Hawaii', description: 'Sóng, núi lửa và nắng nhiệt đới' },
  { slot: 'darkBlue', name: 'London', landmark: 'Tháp đồng hồ Big Ben', description: 'Thủ đô tài chính lâu đời nhất' },
  { slot: 'TAX', name: 'Thuế Tài Sản', description: 'Nộp 10% tổng tài sản' },
  { slot: 'darkBlue', name: 'New York', landmark: 'Tượng Nữ thần Tự do', description: 'Thành phố không bao giờ ngủ' },
]

const SPECIAL_KINDS: readonly string[] = ['START', 'ISLAND', 'FESTIVAL', 'AIRPORT', 'CHANCE', 'TAX']

function isSpecial(slot: Slot): slot is SpecialKind {
  return SPECIAL_KINDS.includes(slot)
}

function buildBoard(): TileDef[] {
  return CONTENT.map((c, index) => {
    const base = {
      index,
      name: c.name,
      description: c.description,
      landmark: c.landmark ?? null,
      side: Math.floor(index / TILES_PER_SIDE) as BoardSide,
      sideIndex: index % TILES_PER_SIDE,
    }
    if (isSpecial(c.slot)) return { ...base, kind: c.slot, group: null, price: null }
    if (c.slot === 'RESORT') return { ...base, kind: 'RESORT', group: null, price: ECONOMY.resort.price }
    return { ...base, kind: 'CITY', group: c.slot, price: ECONOMY.groupPrices[c.slot] }
  })
}

export const BOARD: readonly TileDef[] = buildBoard()
