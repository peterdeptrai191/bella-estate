/**
 * Hằng số kinh tế — giá trị khởi điểm theo docs/GDD.md (v0.1), sẽ cân bằng lại sau.
 * Dữ liệu thuần, game-core được phép import file này.
 */
export const ECONOMY = {
  startingMoney: 1500,
  passStartBonus: 200,
  islandEscapeFee: 100,
  airportFlightFee: 100,
  taxRate: 0.1,
  maxRounds: 30,
  turnTimeLimitSec: 20,
  /** Bán tài sản cho ngân hàng được 50% giá trị. */
  bankSellRatio: 0.5,
  /** Mua lại đất đối thủ = 2 × tổng đã đầu tư. */
  buyoutMultiplier: 2,
  /** Sở hữu trọn nhóm màu: tiền thuê x2. */
  colorGroupRentMultiplier: 2,
  festivalRentMultiplier: 2,
} as const
