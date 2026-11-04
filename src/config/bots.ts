/**
 * Thông số bot AI — docs/GDD.md mục 7. Dữ liệu thuần.
 * Bản đầu chỉ có mức "Thường": ưu tiên gom trọn nhóm màu, luôn giữ lại ít nhất `cashReserve` tiền mặt.
 */
export const BOTS = {
  normal: {
    /** Tiền mặt tối thiểu bot luôn giữ lại sau khi mua/xây. */
    cashReserve: 200,
    /** Xây nhà thì giữ dư hơn (nhân với cashReserve), vì nhà khó bán lại được giá. */
    buildReserveFactor: 1.5,
    /** Phí thoát đảo chỉ trả khi còn dư bấy nhiêu lần cashReserve. */
    islandFeeReserveFactor: 2,
  },
} as const

export type BotLevel = keyof typeof BOTS
