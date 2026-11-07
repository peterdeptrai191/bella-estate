/**
 * Trạng thái HIỂN THỊ của bàn cờ — thứ người chơi đang nhìn thấy, đi sau game-core.
 *
 * game-core cập nhật state ngay lập tức; còn view chỉ thay đổi khi event player phát tới event tương ứng,
 * nên quân cờ/tiền/nhà trên màn hình khớp với animation. Hàm ở đây là thuần (có test):
 * phát lại toàn bộ event phải cho ra đúng view suy từ state cuối của game-core.
 */
import type { GameEvent, GameState, HoldableCardId, PlayerId } from '../game-core'

export interface PlayerView {
  id: PlayerId
  name: string
  /** Thứ tự người chơi (0–3) — dùng chọn màu và model. */
  seat: number
  money: number
  position: number
  bankrupt: boolean
  /** Thẻ Cơ Hội đang giữ (Ra Đảo, Lá Chắn). */
  heldCards: HoldableCardId[]
  /** Đang có thẻ Giảm Giá chờ dùng ở lần trả thuê tới. */
  rentDiscount: boolean
}

export interface TileView {
  owner: PlayerId | null
  level: number
}

export interface BoardView {
  players: PlayerView[]
  tiles: TileView[]
  festivalTile: number | null
  /** Số lần Lễ Hội đã tổ chức (hệ số tiền thuê Lễ Hội). */
  festivalCount: number
  currentPlayerId: PlayerId
  dice: [number, number]
  winner: PlayerId | null
}

export function viewFromGame(state: GameState): BoardView {
  return {
    players: state.players.map((p, seat) => ({
      id: p.id,
      name: p.name,
      seat,
      money: p.money,
      position: p.position,
      bankrupt: p.bankrupt,
      heldCards: [...p.heldCards],
      rentDiscount: p.rentDiscount,
    })),
    tiles: state.tiles.map((t) => ({ owner: t.owner, level: t.level })),
    festivalTile: state.festivalTile,
    festivalCount: state.festivalCount || 0,
    currentPlayerId: state.players[state.currentPlayerIndex].id,
    dice: state.turn.dice ?? [5, 3],
    winner: state.winner,
  }
}

function updatePlayer(view: BoardView, id: PlayerId, fn: (p: PlayerView) => PlayerView): BoardView {
  return { ...view, players: view.players.map((p) => (p.id === id ? fn(p) : p)) }
}

function addMoney(view: BoardView, id: PlayerId | null, amount: number): BoardView {
  return id === null ? view : updatePlayer(view, id, (p) => ({ ...p, money: p.money + amount }))
}

function setTile(view: BoardView, i: number, tile: TileView): BoardView {
  return { ...view, tiles: view.tiles.map((t, j) => (j === i ? tile : t)) }
}

function releaseTile(view: BoardView, i: number): BoardView {
  const next = setTile(view, i, { owner: null, level: 0 })
  return view.festivalTile === i ? { ...next, festivalTile: null } : next
}

/** Áp một event lên view. Event không làm đổi thứ hiển thị thì trả nguyên view. */
export function applyEventToView(view: BoardView, event: GameEvent): BoardView {
  switch (event.type) {
    case 'TURN_STARTED':
      return { ...view, currentPlayerId: event.playerId }
    case 'DICE_ROLLED':
      return { ...view, dice: event.dice }
    case 'PLAYER_MOVED':
      return updatePlayer(view, event.playerId, (p) => ({ ...p, position: event.to }))
    case 'PASSED_START':
      return addMoney(view, event.playerId, event.amount)
    case 'PROPERTY_BOUGHT':
      return setTile(addMoney(view, event.playerId, -event.price), event.tileIndex, {
        owner: event.playerId,
        level: 0,
      })
    case 'BUILT':
      return setTile(addMoney(view, event.playerId, -event.cost), event.tileIndex, {
        owner: event.playerId,
        level: event.level,
      })
    case 'RENT_PAID':
      // Trả thuê luôn dùng hết thẻ Giảm Giá (nếu có).
      return updatePlayer(addMoney(addMoney(view, event.from, -event.amount), event.to, event.amount), event.from, (p) => ({
        ...p,
        rentDiscount: false,
      }))
    case 'DEBT_STARTED':
      return event.reason === 'RENT' ? updatePlayer(view, event.playerId, (p) => ({ ...p, rentDiscount: false })) : view
    case 'CARD_DRAWN':
      if (event.card === 'ESCAPE_ISLAND' || event.card === 'SHIELD') {
        const card = event.card
        return updatePlayer(view, event.playerId, (p) => ({ ...p, heldCards: [...p.heldCards, card] }))
      }
      return event.card === 'DISCOUNT' ? updatePlayer(view, event.playerId, (p) => ({ ...p, rentDiscount: true })) : view
    case 'CARD_USED': {
      const card = event.card
      return updatePlayer(view, event.playerId, (p) => {
        const at = p.heldCards.indexOf(card)
        return at < 0 ? p : { ...p, heldCards: p.heldCards.filter((_, i) => i !== at) }
      })
    }
    case 'BOUGHT_OUT': {
      const paid = addMoney(addMoney(view, event.playerId, -event.price), event.from, event.price)
      return setTile(paid, event.tileIndex, { ...paid.tiles[event.tileIndex], owner: event.playerId })
    }
    case 'MONEY_PAID':
      return addMoney(addMoney(view, event.from, -event.amount), event.to, event.amount)
    case 'MONEY_RECEIVED':
      return addMoney(view, event.playerId, event.amount)
    case 'FESTIVAL_HOSTED':
      return { ...view, festivalTile: event.tileIndex, festivalCount: event.count }
    case 'HOUSE_DESTROYED':
      return setTile(view, event.tileIndex, { ...view.tiles[event.tileIndex], level: event.level })
    case 'PROPERTY_SOLD':
      return releaseTile(addMoney(view, event.playerId, event.amount), event.tileIndex)
    case 'BANKRUPT': {
      let next = updatePlayer(view, event.playerId, (p) => ({ ...p, money: 0, bankrupt: true, heldCards: [], rentDiscount: false }))
      for (const i of event.releasedTiles) next = releaseTile(next, i)
      return next
    }
    case 'GAME_OVER':
      return { ...view, winner: event.winner }
    default:
      return view
  }
}

/**
 * View đã phát hết event có khớp state game-core không (tiền, vị trí, phá sản, chủ đất, số nhà, Lễ Hội).
 * Dùng để tự sửa nếu lỡ lệch (vd. mạng chập chờn khi chơi online).
 */
export function viewMatchesGame(view: BoardView, state: GameState): boolean {
  const truth = viewFromGame(state)
  if (view.festivalTile !== truth.festivalTile || view.festivalCount !== truth.festivalCount || view.players.length !== truth.players.length) return false
  const playersOk = view.players.every((p, i) => {
    const t = truth.players[i]
    return p.id === t.id && p.money === t.money && p.position === t.position && p.bankrupt === t.bankrupt
  })
  return playersOk && view.tiles.every((t, i) => t.owner === truth.tiles[i].owner && t.level === truth.tiles[i].level)
}
