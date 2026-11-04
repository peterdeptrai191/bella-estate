/**
 * Thông số bot AI — docs/GDD.md mục 7. Dữ liệu thuần.
 * - Dễ: mua ngẫu nhiên khoảng 60% số ô gặp, ít khi xây nhà.
 * - Thường: ưu tiên gom trọn nhóm màu, luôn giữ lại ít nhất 200 tiền mặt.
 * - Khó: tính kỳ vọng tiền thuê, chặn đối thủ sắp hoàn thành nhóm màu / cạnh bàn cờ, mua lại có chiến thuật.
 */
export const BOT_LEVELS = ['easy', 'normal', 'hard'] as const
export type BotLevel = (typeof BOT_LEVELS)[number]

export const BOT_LEVEL_NAMES: Record<BotLevel, string> = {
  easy: 'Dễ',
  normal: 'Thường',
  hard: 'Khó',
}

export const BOTS = {
  easy: {
    /** Xác suất mua khi đủ tiền. */
    buyChance: 0.6,
    /** Xác suất xây khi đủ tiền. */
    buildChance: 0.15,
    /** Xác suất mua lại khi đủ tiền. */
    buyoutChance: 0.1,
    cashReserve: 50,
  },
  normal: {
    /** Tiền mặt tối thiểu bot luôn giữ lại sau khi mua/xây. */
    cashReserve: 200,
    /** Xây nhà thì giữ dư hơn (nhân với cashReserve), vì nhà khó bán lại được giá. */
    buildReserveFactor: 1.5,
    /** Phí thoát đảo chỉ trả khi còn dư bấy nhiêu lần cashReserve. */
    islandFeeReserveFactor: 2,
  },
  hard: {
    /** Tiền dự trữ tối thiểu; thực tế giữ bằng tiền thuê lớn nhất của đối thủ (kỳ vọng phải trả), kẹp trong [min, max]. */
    minReserve: 100,
    maxReserve: 500,
    /** Mua để chặn đối thủ / gom trọn nhóm thì chấp nhận giữ ít tiền hơn. */
    strategicReserve: 60,
    /** Trước vòng này, thoát đảo sớm để còn mua đất; sau đó ở lại đảo để né tiền thuê. */
    leaveIslandBeforeRound: 12,
  },
} as const
