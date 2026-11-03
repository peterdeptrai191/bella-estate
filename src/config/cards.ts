/**
 * 10 thẻ Cơ Hội — docs/GDD.md mục 6. Dữ liệu thuần; con số nằm ở economy.ts.
 */
export const CARD_IDS = [
  'ESCAPE_ISLAND',
  'DISCOUNT',
  'SHIELD',
  'GO_TO_START',
  'GO_TO_FESTIVAL',
  'EARTHQUAKE',
  'GO_TO_ISLAND',
  'SURPRISE_TAX',
  'CHARITY',
  'LOTTERY',
] as const

export type CardId = (typeof CARD_IDS)[number]

/** Thẻ người chơi giữ lại và chủ động dùng bằng action USE_CARD. */
export type HoldableCardId = 'ESCAPE_ISLAND' | 'SHIELD'

export interface CardDef {
  name: string
  description: string
}

export const CARDS: Record<CardId, CardDef> = {
  ESCAPE_ISLAND: { name: 'Ra Đảo', description: 'Giữ lại, dùng để thoát Đảo Hoang' },
  DISCOUNT: { name: 'Giảm Giá', description: 'Lần trả tiền thuê tiếp theo giảm 50%' },
  SHIELD: { name: 'Lá Chắn', description: 'Giữ lại, miễn trả tiền thuê một lần' },
  GO_TO_START: { name: 'Về Xuất Phát', description: 'Di chuyển ngay tới ô Xuất Phát (nhận +200)' },
  GO_TO_FESTIVAL: { name: 'Đi Lễ Hội', description: 'Di chuyển tới ô Lễ Hội' },
  EARTHQUAKE: { name: 'Động Đất', description: 'Phá 1 nhà của một đối thủ tùy chọn (không áp dụng với Landmark)' },
  GO_TO_ISLAND: { name: 'Ra Đảo Ngay', description: 'Bị đưa ra Đảo Hoang' },
  SURPRISE_TAX: { name: 'Thuế Bất Ngờ', description: 'Nộp 100 cho mỗi căn nhà đang sở hữu' },
  CHARITY: { name: 'Từ Thiện', description: 'Trả 50 cho mỗi người chơi khác' },
  LOTTERY: { name: 'Trúng Xổ Số', description: 'Nhận 200' },
}
