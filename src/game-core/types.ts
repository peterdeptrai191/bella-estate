import type { CardId, HoldableCardId } from '../config/cards'

export type { CardId, HoldableCardId }
export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
  isBot: boolean
  money: number
  position: number
  bankrupt: boolean
  /** > 0: đang kẹt ở Đảo Hoang, còn tối đa bấy nhiêu lượt. */
  islandTurnsLeft: number
  /** Thẻ đang giữ (Ra Đảo, Lá Chắn). */
  heldCards: HoldableCardId[]
  /** Thẻ Giảm Giá đang có hiệu lực cho lần trả tiền thuê tiếp theo. */
  rentDiscount: boolean
  /** Đã dừng ở Sân Bay: lượt sau được bay. */
  airportTicket: boolean
}

export interface TileState {
  owner: PlayerId | null
  /** Thành phố: 0 = đất trống, 1–3 = số nhà, 4 = Landmark. Khu Du Lịch luôn 0. */
  level: number
}

export interface Payment {
  /** null = trả cho ngân hàng. */
  to: PlayerId | null
  amount: number
}

export type DebtReason = 'RENT' | 'TAX' | 'SURPRISE_TAX' | 'CHARITY'

/** Việc người chơi BẮT BUỘC xử lý trước khi kết thúc lượt. */
export type Pending =
  | { type: 'RENT'; tileIndex: number; to: PlayerId; amount: number }
  | { type: 'DEBT'; reason: DebtReason; payments: Payment[]; tileIndex: number | null; discounted: boolean }
  | { type: 'DRAW_CARD' }
  | { type: 'EARTHQUAKE' }

/**
 * Bước trong lượt:
 * - ROLL: chờ tung xúc xắc (hoặc bay / thoát đảo)
 * - MOVE: đã tung, chờ di chuyển
 * - ACT: đã tới ô, có thể mua/xây/mua lại… rồi END_TURN
 */
export type TurnStep = 'ROLL' | 'MOVE' | 'ACT'

export interface TurnState {
  step: TurnStep
  dice: [number, number] | null
  doublesCount: number
  /** Đã tung đôi: sau END_TURN được tung tiếp. */
  extraRoll: boolean
  pending: Pending | null
  /** Ô được phép xây trong lần dừng này. */
  buildTile: number | null
  /** Ô vừa có được trong lần dừng này (mua hoặc mua lại) — chưa được xây Landmark. */
  acquiredTile: number | null
  /** Ô được quyền mua lại (sau khi đã trả/miễn tiền thuê). */
  buyoutTile: number | null
  /** Dừng đúng Xuất Phát: được xây 1 nhà miễn phí. */
  freeHouse: boolean
  /** Dừng ở Lễ Hội: được chọn thành phố tổ chức. */
  festivalChoice: boolean
}

export type WinReason = 'LAST_SURVIVOR' | 'THREE_COLOR_GROUPS' | 'SIDE_MONOPOLY' | 'ALL_RESORTS' | 'ROUND_LIMIT'

export type GamePhase = 'playing' | 'finished'

export interface GameState {
  phase: GamePhase
  players: Player[]
  tiles: TileState[]
  currentPlayerIndex: number
  /** Vòng hiện tại, bắt đầu từ 1. */
  round: number
  /** Thành phố đang tổ chức Lễ Hội. */
  festivalTile: number | null
  /** Trạng thái RNG (mulberry32). Cùng seed + cùng chuỗi action = cùng kết quả. */
  rngState: number
  turn: TurnState
  winner: PlayerId | null
  winReason: WinReason | null
}

export type GameAction =
  | { type: 'ROLL_DICE'; playerId: PlayerId }
  | { type: 'MOVE'; playerId: PlayerId }
  | { type: 'BUY'; playerId: PlayerId }
  | { type: 'BUILD'; playerId: PlayerId; tileIndex: number }
  | { type: 'BUYOUT'; playerId: PlayerId }
  | { type: 'PAY_RENT'; playerId: PlayerId }
  | { type: 'DRAW_CARD'; playerId: PlayerId }
  | { type: 'USE_CARD'; playerId: PlayerId; card: HoldableCardId }
  | { type: 'SELL'; playerId: PlayerId; tileIndex: number }
  | { type: 'END_TURN'; playerId: PlayerId }
  | { type: 'HOST_FESTIVAL'; playerId: PlayerId; tileIndex: number }
  | { type: 'FLY'; playerId: PlayerId; tileIndex: number }
  | { type: 'PAY_ISLAND_FEE'; playerId: PlayerId }
  | { type: 'EARTHQUAKE'; playerId: PlayerId; tileIndex: number }

export type GameActionType = GameAction['type']

export type MoneyReason = 'TAX' | 'SURPRISE_TAX' | 'CHARITY' | 'ISLAND_FEE' | 'FLIGHT' | 'BANKRUPTCY'

export interface Standing {
  playerId: PlayerId
  netWorth: number
  money: number
  bankrupt: boolean
}

/** Sự kiện sinh ra bởi mỗi action — UI dựa vào đây để chạy animation. */
export type GameEvent =
  | { type: 'TURN_STARTED'; playerId: PlayerId; round: number }
  | { type: 'DICE_ROLLED'; playerId: PlayerId; dice: [number, number]; isDouble: boolean }
  | { type: 'EXTRA_ROLL'; playerId: PlayerId }
  | { type: 'PLAYER_MOVED'; playerId: PlayerId; from: number; to: number; steps: number; mode: 'WALK' | 'FLY' | 'TELEPORT' }
  | { type: 'PASSED_START'; playerId: PlayerId; amount: number }
  | { type: 'FREE_HOUSE_AVAILABLE'; playerId: PlayerId }
  | { type: 'PROPERTY_BOUGHT'; playerId: PlayerId; tileIndex: number; price: number }
  | { type: 'BUILT'; playerId: PlayerId; tileIndex: number; level: number; cost: number; free: boolean }
  | { type: 'RENT_DUE'; from: PlayerId; to: PlayerId; tileIndex: number; amount: number }
  | { type: 'RENT_PAID'; from: PlayerId; to: PlayerId; tileIndex: number; amount: number; discounted: boolean }
  | { type: 'RENT_WAIVED'; from: PlayerId; to: PlayerId; tileIndex: number; amount: number }
  | { type: 'BOUGHT_OUT'; playerId: PlayerId; from: PlayerId; tileIndex: number; price: number }
  | { type: 'MONEY_PAID'; from: PlayerId; to: PlayerId | null; amount: number; reason: MoneyReason }
  | { type: 'MONEY_RECEIVED'; playerId: PlayerId; amount: number; reason: 'LOTTERY' }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; card: CardId }
  | { type: 'CARD_USED'; playerId: PlayerId; card: HoldableCardId }
  | { type: 'SENT_TO_ISLAND'; playerId: PlayerId; reason: 'THREE_DOUBLES' | 'TILE' | 'CARD' }
  | { type: 'ISLAND_STAY'; playerId: PlayerId; turnsLeft: number }
  | { type: 'ISLAND_ESCAPED'; playerId: PlayerId; method: 'DOUBLES' | 'FEE' | 'CARD' }
  | { type: 'AIRPORT_TICKET'; playerId: PlayerId }
  | { type: 'FESTIVAL_HOSTED'; playerId: PlayerId; tileIndex: number; previousTile: number | null }
  | { type: 'HOUSE_DESTROYED'; byPlayerId: PlayerId; owner: PlayerId; tileIndex: number; level: number }
  | { type: 'DEBT_STARTED'; playerId: PlayerId; amount: number; reason: DebtReason }
  | { type: 'PROPERTY_SOLD'; playerId: PlayerId; tileIndex: number; amount: number }
  | { type: 'BANKRUPT'; playerId: PlayerId; releasedTiles: number[] }
  | { type: 'GAME_OVER'; winner: PlayerId; reason: WinReason; standings: Standing[] }

export type GameEventType = GameEvent['type']

export interface ActionResult {
  state: GameState
  events: GameEvent[]
}
