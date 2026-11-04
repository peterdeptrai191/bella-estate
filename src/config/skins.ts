/**
 * Skin quân cờ (Kenney Mini Characters / Cube Pets, CC0) — chỉ mang tính trang trí (GDD mục 10).
 * Giá tính bằng Vàng (GDD mục 9). Dữ liệu thuần.
 */
export interface SkinDef {
  id: string
  name: string
  kind: 'character' | 'pet'
  /** Đường dẫn tương đối tới model GLB trong public/. */
  model: string
  /** Ảnh chân dung trong public/avatars. */
  avatar: string
  /** Giá Vàng; 0 = miễn phí. */
  price: number
}

const character = (file: string, name: string, price: number): SkinDef => ({
  id: file,
  name,
  kind: 'character',
  model: `models/characters/character-${file}.glb`,
  avatar: `avatars/character-${file}.png`,
  price,
})

const pet = (file: string, name: string, price: number): SkinDef => ({
  id: file,
  name,
  kind: 'pet',
  model: `models/pets/animal-${file}.glb`,
  avatar: `avatars/animal-${file}.png`,
  price,
})

export const SKINS: readonly SkinDef[] = [
  character('female-b', 'Bella', 0),
  character('male-c', 'Cảnh sát Hùng', 0),
  character('female-a', 'Mai', 0),
  character('male-e', 'Giáo sư Tâm', 0),
  character('female-c', 'Nhà thám hiểm Lan', 150),
  character('female-d', 'Doanh nhân Vy', 150),
  character('male-a', 'Đầu bếp Nam', 150),
  character('male-b', 'Bác sĩ Long', 200),
  character('female-e', 'Ca sĩ Hà', 250),
  character('female-f', 'Phi công Thảo', 250),
  character('male-d', 'Thợ xây Phúc', 300),
  character('male-f', 'Vận động viên Khoa', 300),
  pet('cat', 'Mèo Mun', 500),
  pet('dog', 'Cún Vàng', 500),
  pet('fox', 'Cáo Lửa', 700),
  pet('panda', 'Gấu Trúc', 800),
]

export const DEFAULT_SKIN = 'female-b'
/** Skin cho bot/người chơi chưa chọn, theo thứ tự ghế. */
export const SEAT_SKINS = ['female-b', 'male-c', 'female-a', 'male-e'] as const

export function skinById(id: string | undefined): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}

/** Phần thưởng và ví (GDD mục 9). */
export const META = {
  /** Vàng tặng khi mới chơi lần đầu, để thử cửa hàng. */
  startingGold: 200,
  goldWin: 100,
  goldLose: 30,
  /** Tên mặc định của người chơi. */
  defaultName: 'Bạn',
  maxNameLength: 12,
} as const
