/** Mô tả event bằng tiếng Việt — dùng cho log giả lập và nhật ký trận trong UI. */
import { BOARD } from '../config/board'
import { CARDS } from '../config/cards'
import type { GameEvent, GameState, MoneyReason, PlayerId, WinReason } from './types'

export function formatMoney(amount: number): string {
  return amount.toLocaleString('vi-VN')
}

const WIN_REASONS: Record<WinReason, string> = {
  LAST_SURVIVOR: 'người sống sót cuối cùng',
  THREE_COLOR_GROUPS: 'độc quyền 3 nhóm màu',
  SIDE_MONOPOLY: 'độc quyền một cạnh bàn cờ',
  ALL_RESORTS: 'độc quyền 4 Khu Du Lịch',
  ROUND_LIMIT: 'tổng tài sản cao nhất khi hết vòng',
}

const MONEY_REASONS: Record<MoneyReason, string> = {
  TAX: 'nộp thuế',
  SURPRISE_TAX: 'Thuế Bất Ngờ',
  CHARITY: 'Từ Thiện',
  ISLAND_FEE: 'phí thoát đảo',
  FLIGHT: 'phí bay',
  BANKRUPTCY: 'trả nợ khi phá sản',
}

export function describeEvent(event: GameEvent, state: GameState): string {
  const name = (id: PlayerId | null) => (id === null ? 'ngân hàng' : (state.players.find((p) => p.id === id)?.name ?? id))
  const tile = (i: number) => BOARD[i].name
  const levelName = (level: number) => (level === 0 ? 'đất trống' : level >= 4 ? 'Landmark' : `${level} nhà`)

  switch (event.type) {
    case 'TURN_STARTED':
      return `Lượt của ${name(event.playerId)} (vòng ${event.round})`
    case 'DICE_ROLLED':
      return `${name(event.playerId)} tung ${event.dice[0]} + ${event.dice[1]}${event.isDouble ? ' — ĐÔI!' : ''}`
    case 'EXTRA_ROLL':
      return `${name(event.playerId)} được tung thêm`
    case 'PLAYER_MOVED': {
      const how = event.mode === 'FLY' ? 'bay' : event.mode === 'TELEPORT' ? 'dịch chuyển' : 'đi'
      return `${name(event.playerId)} ${how} từ ${tile(event.from)} tới ${tile(event.to)}`
    }
    case 'PASSED_START':
      return `${name(event.playerId)} qua Xuất Phát, nhận ${formatMoney(event.amount)}`
    case 'FREE_HOUSE_AVAILABLE':
      return `${name(event.playerId)} được xây 1 nhà miễn phí`
    case 'PROPERTY_BOUGHT':
      return `${name(event.playerId)} mua ${tile(event.tileIndex)} giá ${formatMoney(event.price)}`
    case 'BUILT':
      return `${name(event.playerId)} xây ${tile(event.tileIndex)} lên ${levelName(event.level)}${event.free ? ' (miễn phí)' : ` giá ${formatMoney(event.cost)}`}`
    case 'RENT_DUE':
      return `${name(event.from)} phải trả ${formatMoney(event.amount)} tiền thuê ${tile(event.tileIndex)} cho ${name(event.to)}`
    case 'RENT_PAID':
      return `${name(event.from)} trả ${formatMoney(event.amount)} cho ${name(event.to)}${event.discounted ? ' (giảm giá 50%)' : ''}`
    case 'RENT_WAIVED':
      return `${name(event.from)} được miễn ${formatMoney(event.amount)} tiền thuê`
    case 'BOUGHT_OUT':
      return `${name(event.playerId)} MUA LẠI ${tile(event.tileIndex)} từ ${name(event.from)} giá ${formatMoney(event.price)}`
    case 'MONEY_PAID':
      return `${name(event.from)} trả ${formatMoney(event.amount)} cho ${name(event.to)} (${MONEY_REASONS[event.reason]})`
    case 'MONEY_RECEIVED':
      return `${name(event.playerId)} nhận ${formatMoney(event.amount)} (Trúng Xổ Số)`
    case 'CARD_DRAWN':
      return `${name(event.playerId)} rút thẻ "${CARDS[event.card].name}": ${CARDS[event.card].description}`
    case 'CARD_USED':
      return `${name(event.playerId)} dùng thẻ "${CARDS[event.card].name}"`
    case 'SENT_TO_ISLAND': {
      const why = { THREE_DOUBLES: '3 lần đôi liên tiếp', TILE: 'dừng ở Đảo Hoang', CARD: 'thẻ Ra Đảo Ngay' }
      return `${name(event.playerId)} bị đưa ra Đảo Hoang (${why[event.reason]})`
    }
    case 'ISLAND_STAY':
      return `${name(event.playerId)} vẫn kẹt ở Đảo Hoang${event.turnsLeft > 0 ? ` (còn tối đa ${event.turnsLeft} lượt)` : ', lượt sau được tự do'}`
    case 'ISLAND_ESCAPED': {
      const how = { DOUBLES: 'tung được đôi', FEE: 'trả phí', CARD: 'dùng thẻ' }
      return `${name(event.playerId)} thoát Đảo Hoang (${how[event.method]})`
    }
    case 'AIRPORT_TICKET':
      return `${name(event.playerId)} ở Sân Bay — lượt sau được bay`
    case 'FESTIVAL_HOSTED':
      return `${name(event.playerId)} tổ chức Lễ Hội ở ${tile(event.tileIndex)} (tiền thuê x2)`
    case 'EARTHQUAKE_NO_TARGET':
      return `Động Đất: đối thủ chưa có nhà nào để phá — thẻ không có tác dụng`
    case 'HOUSE_DESTROYED':
      return `Động Đất! ${name(event.byPlayerId)} phá 1 nhà ở ${tile(event.tileIndex)} của ${name(event.owner)} (còn ${levelName(event.level)})`
    case 'DEBT_STARTED':
      return `${name(event.playerId)} thiếu tiền trả ${formatMoney(event.amount)} — phải bán tài sản`
    case 'PROPERTY_SOLD':
      return `${name(event.playerId)} bán ${tile(event.tileIndex)} cho ngân hàng được ${formatMoney(event.amount)}`
    case 'BANKRUPT':
      return `💥 ${name(event.playerId)} PHÁ SẢN`
    case 'GAME_OVER':
      return `🏆 ${name(event.winner)} THẮNG — ${WIN_REASONS[event.reason]}`
  }
}
