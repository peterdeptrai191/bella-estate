/**
 * MỌI con số kinh tế của game — theo docs/GDD.md (v0.1).
 * Cân bằng game chỉ cần sửa file này. Dữ liệu thuần, game-core được phép import.
 */
import type { ColorGroupId } from './board'

export const ECONOMY = {
  /** Tiền mỗi người khi bắt đầu ván. */
  startingMoney: 1500,
  /** Thưởng mỗi lần đi qua (hoặc dừng đúng) ô Xuất Phát. */
  passStartBonus: 200,

  dice: {
    /** Số lần tung đôi liên tiếp thì bị đưa ra Đảo Hoang. */
    maxConsecutiveDoubles: 3,
  },

  island: {
    /** Số lượt tối đa bị kẹt ở Đảo Hoang. */
    maxTurns: 3,
    /** Phí trả để thoát đảo. */
    escapeFee: 100,
  },

  airport: {
    /** Phí bay từ Sân Bay tới ô bất kỳ. */
    flightFee: 100,
  },

  /** Ô Thuế: nộp tỷ lệ này trên tổng tài sản (tiền mặt + giá trị đã đầu tư). */
  taxRate: 0.1,
  /** Hết số vòng này thì người có tổng tài sản cao nhất thắng (mặc định). */
  maxRounds: 30,
  /** Các lựa chọn số vòng khi tạo phòng (chủ phòng chọn). */
  roundOptions: [30, 50, 70],
  /** Giới hạn thời gian mỗi lượt (UI/server dùng, game-core không đếm giờ). */
  turnTimeLimitSec: 20,

  /** Giá đất P theo nhóm màu. */
  groupPrices: {
    brown: 60,
    lightBlue: 100,
    pink: 140,
    orange: 180,
    red: 220,
    yellow: 260,
    darkBlue: 320,
  } satisfies Record<ColorGroupId, number>,

  city: {
    /** Số nhà tối đa trước khi lên Landmark. Cấp độ: 0 = đất trống, 1–3 = nhà, 4 = Landmark. */
    maxHouses: 3,
    /** Vòng đầu (người chơi chưa đi qua Xuất Phát lần nào): mỗi thành phố tối đa bấy nhiêu nhà. */
    firstLapMaxHouses: 2,
    /** Chi phí để đạt mỗi cấp, tính theo P. Cấp 0 = giá mua đất. */
    buildCostRatio: [1, 0.5, 0.5, 0.5, 1],
    /** Tiền thuê ở mỗi cấp, tính theo P. */
    rentRatio: [0.2, 0.6, 1.2, 2, 3],
  },

  resort: {
    /** Giá mua một Khu Du Lịch. */
    price: 200,
    /** Tiền thuê theo số Khu Du Lịch chủ sở hữu đang có (index = số khu). */
    rentByCount: [0, 50, 100, 200, 400],
  },

  /** Sở hữu trọn nhóm màu: tiền thuê x hệ số này. */
  colorGroupRentMultiplier: 2,
  /**
   * Lễ Hội: lần tổ chức đầu tiên trong ván tiền thuê x2, mỗi lần tổ chức sau (ở bất kỳ đâu) hệ số tăng thêm
   * `festivalRentStep`, tối đa `festivalRentMax`.
   */
  festivalRentMultiplier: 2,
  festivalRentStep: 1,
  festivalRentMax: 5,
  /** Giá mua lại = hệ số này x tổng giá trị đã đầu tư. */
  buyoutMultiplier: 2,
  /** Bán cho ngân hàng được tỷ lệ này trên giá trị đã đầu tư. */
  bankSellRatio: 0.7,

  cards: {
    /** Thẻ Giảm Giá: lần trả tiền thuê tiếp theo nhân hệ số này. */
    rentDiscountRatio: 0.5,
    /** Thẻ Trúng Xổ Số. */
    lotteryPrize: 200,
    /** Thẻ Từ Thiện: trả cho mỗi người chơi khác. */
    charityPerPlayer: 50,
    /** Thẻ Thuế Bất Ngờ: nộp cho mỗi căn nhà. */
    surpriseTaxPerHouse: 100,
  },

  win: {
    /** Số nhóm màu độc quyền để thắng ngay. */
    colorGroupsToWin: 3,
  },
} as const
