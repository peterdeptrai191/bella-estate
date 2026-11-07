/**
 * Reducer thuần: applyAction(state, action) → { state mới, events }.
 * State đầu vào không bị sửa (làm việc trên bản sao). Action sai luật → ném GameRuleError.
 */
import { ECONOMY } from '../config/economy'
import { AIRPORT_INDEX, LANDMARK_LEVEL, isPurchasable, isValidTileIndex, tileDef } from './board'
import { drawRandomCard, isEarthquakeTarget, resolveCard } from './cards'
import { type Ctx, GameRuleError, currentPlayer, emit, ensure, playerById, rollDie } from './context'
import { afterRent, charge, settleDebtIfPossible } from './money'
import { houseCap, landOn, moveTo, sendToIsland, walk } from './movement'
import { advanceTurn, freshTurn } from './turn'
import type { ActionResult, GameAction, GameState, HoldableCardId } from './types'
import { buildCost, buyoutPrice, sellValue } from './valuation'
import { checkWin } from './win'

export function applyAction(state: GameState, action: GameAction): ActionResult {
  if (state.phase !== 'playing') throw new GameRuleError('Ván đấu đã kết thúc')
  if (action.playerId !== currentPlayer(state).id) {
    throw new GameRuleError(`Chưa tới lượt của ${action.playerId}`)
  }

  const ctx: Ctx = { s: structuredClone(state), events: [] }

  switch (action.type) {
    case 'ROLL_DICE':
      rollDice(ctx)
      break
    case 'MOVE':
      move(ctx)
      break
    case 'BUY':
      buy(ctx)
      break
    case 'BUILD':
      build(ctx, action.tileIndex)
      break
    case 'BUYOUT':
      buyout(ctx)
      break
    case 'PAY_RENT':
      payRent(ctx)
      break
    case 'DRAW_CARD':
      drawCard(ctx)
      break
    case 'USE_CARD':
      playCard(ctx, action.card)
      break
    case 'SELL':
      sell(ctx, action.tileIndex)
      break
    case 'END_TURN':
      endTurn(ctx)
      break
    case 'HOST_FESTIVAL':
      hostFestival(ctx, action.tileIndex)
      break
    case 'FLY':
      fly(ctx, action.tileIndex)
      break
    case 'PAY_ISLAND_FEE':
      payIslandFee(ctx)
      break
    case 'EARTHQUAKE':
      earthquake(ctx, action.tileIndex)
      break
    default: {
      const unknown: never = action
      throw new GameRuleError(`Action không hợp lệ: ${JSON.stringify(unknown)}`)
    }
  }

  checkWin(ctx)
  return { state: ctx.s, events: ctx.events }
}

function ensureFreeToAct(ctx: Ctx): void {
  ensure(ctx.s.turn.step === 'ACT', 'Chưa tới bước hành động')
  ensure(ctx.s.turn.pending === null, 'Còn việc bắt buộc chưa xử lý')
}

function rollDice(ctx: Ctx): void {
  const t = ctx.s.turn
  const player = currentPlayer(ctx.s)
  ensure(t.step === 'ROLL' && t.pending === null, 'Không thể tung xúc xắc lúc này')

  const dice: [number, number] = [rollDie(ctx), rollDie(ctx)]
  const isDouble = dice[0] === dice[1]
  t.dice = dice
  emit(ctx, { type: 'DICE_ROLLED', playerId: player.id, dice, isDouble })

  if (player.islandTurnsLeft > 0) {
    if (isDouble) {
      player.islandTurnsLeft = 0
      emit(ctx, { type: 'ISLAND_ESCAPED', playerId: player.id, method: 'DOUBLES' })
      t.extraRoll = false
      t.step = 'MOVE'
    } else {
      player.islandTurnsLeft--
      emit(ctx, { type: 'ISLAND_STAY', playerId: player.id, turnsLeft: player.islandTurnsLeft })
      t.step = 'ACT'
    }
    return
  }

  // Tung xúc xắc thay vì bay: vé Sân Bay hết hiệu lực.
  player.airportTicket = false

  if (isDouble) {
    t.doublesCount++
    if (t.doublesCount >= ECONOMY.dice.maxConsecutiveDoubles) {
      t.step = 'ACT'
      sendToIsland(ctx, 'THREE_DOUBLES')
      return
    }
    t.extraRoll = true
  } else {
    t.extraRoll = false
  }
  t.step = 'MOVE'
}

function move(ctx: Ctx): void {
  const t = ctx.s.turn
  ensure(t.step === 'MOVE' && t.dice !== null, 'Chưa tung xúc xắc')
  const steps = t.dice[0] + t.dice[1]
  t.step = 'ACT'
  walk(ctx, steps, 'WALK')
  landOn(ctx)
}

function buy(ctx: Ctx): void {
  ensureFreeToAct(ctx)
  const s = ctx.s
  const player = currentPlayer(s)
  const i = player.position
  ensure(isPurchasable(i), 'Ô này không mua được')
  ensure(s.tiles[i].owner === null, 'Ô này đã có chủ')
  const price = tileDef(i).price ?? 0
  ensure(player.money >= price, 'Không đủ tiền mua')

  player.money -= price
  s.tiles[i] = { owner: player.id, level: 0 }
  s.turn.acquiredTile = i
  if (tileDef(i).kind === 'CITY') s.turn.buildTile = i
  emit(ctx, { type: 'PROPERTY_BOUGHT', playerId: player.id, tileIndex: i, price })
}

function build(ctx: Ctx, tileIndex: number): void {
  ensureFreeToAct(ctx)
  const s = ctx.s
  const t = s.turn
  const player = currentPlayer(s)
  ensure(isValidTileIndex(tileIndex), 'Ô không tồn tại')
  const tile = s.tiles[tileIndex]
  ensure(tileDef(tileIndex).kind === 'CITY' && tile.owner === player.id, 'Chỉ xây được trên thành phố của mình')

  if (t.freeHouse) {
    ensure(tile.level < houseCap(player), 'Nhà miễn phí chỉ xây khi ô chưa đủ nhà')
    tile.level++
    t.freeHouse = false
    emit(ctx, { type: 'BUILT', playerId: player.id, tileIndex, level: tile.level, cost: 0, free: true })
    return
  }

  ensure(t.buildTile === tileIndex, 'Chỉ được xây trên ô đang đứng')
  ensure(tile.level < LANDMARK_LEVEL, 'Ô đã có Landmark')
  const next = tile.level + 1
  if (next === LANDMARK_LEVEL) {
    ensure(t.acquiredTile !== tileIndex, 'Landmark chỉ xây được ở lần dừng sau khi có ô này')
    // Đủ 3 nhà từ TRƯỚC lần dừng này mới được lên Landmark (vừa xây đủ 3 nhà thì chờ lần dừng sau).
    ensure(t.arrivalLevel === ECONOMY.city.maxHouses, 'Landmark chỉ xây được khi ô đã có 3 nhà từ lần dừng trước')
  } else {
    ensure(next <= houseCap(player), `Vòng đầu (chưa qua Xuất Phát) chỉ xây tối đa ${ECONOMY.city.firstLapMaxHouses} nhà`)
  }
  const cost = buildCost(tileIndex, next)
  ensure(player.money >= cost, 'Không đủ tiền xây')
  player.money -= cost
  tile.level = next
  emit(ctx, { type: 'BUILT', playerId: player.id, tileIndex, level: next, cost, free: false })
}

function buyout(ctx: Ctx): void {
  ensureFreeToAct(ctx)
  const s = ctx.s
  const t = s.turn
  const player = currentPlayer(s)
  const i = player.position
  ensure(t.buyoutTile === i, 'Chỉ mua lại được ô vừa trả tiền thuê')
  const tile = s.tiles[i]
  ensure(tile.owner !== null && tile.owner !== player.id, 'Ô này không thuộc đối thủ')
  ensure(tile.level < LANDMARK_LEVEL, 'Landmark không thể bị mua lại')
  ensure(tileDef(i).kind !== 'RESORT', 'Khu Du Lịch không thể bị mua lại')
  const price = buyoutPrice(s, i)
  ensure(player.money >= price, 'Không đủ tiền mua lại')

  const previousOwner = playerById(s, tile.owner)
  player.money -= price
  previousOwner.money += price
  tile.owner = player.id
  t.buyoutTile = null
  t.acquiredTile = i
  if (tileDef(i).kind === 'CITY') t.buildTile = i
  emit(ctx, { type: 'BOUGHT_OUT', playerId: player.id, from: previousOwner.id, tileIndex: i, price })
}

function payRent(ctx: Ctx): void {
  const s = ctx.s
  const pending = s.turn.pending
  ensure(pending?.type === 'RENT', 'Không có tiền thuê cần trả')
  const player = currentPlayer(s)
  let amount = pending.amount
  let discounted = false
  if (player.rentDiscount) {
    amount = Math.round(amount * ECONOMY.cards.rentDiscountRatio)
    player.rentDiscount = false
    discounted = true
  }
  s.turn.pending = null
  const result = charge(ctx, [{ to: pending.to, amount }], 'RENT', pending.tileIndex, discounted)
  if (result === 'PAID') afterRent(ctx, pending.tileIndex)
}

function drawCard(ctx: Ctx): void {
  const s = ctx.s
  ensure(s.turn.pending?.type === 'DRAW_CARD', 'Không ở ô Cơ Hội')
  s.turn.pending = null
  const card = drawRandomCard(ctx)
  emit(ctx, { type: 'CARD_DRAWN', playerId: currentPlayer(s).id, card })
  resolveCard(ctx, card)
}

function playCard(ctx: Ctx, card: HoldableCardId): void {
  const s = ctx.s
  const t = s.turn
  const player = currentPlayer(s)
  const at = player.heldCards.indexOf(card)
  ensure(at >= 0, 'Không có thẻ này')

  if (card === 'ESCAPE_ISLAND') {
    ensure(t.step === 'ROLL' && player.islandTurnsLeft > 0, 'Chỉ dùng thẻ Ra Đảo khi đang kẹt ở Đảo Hoang')
    player.heldCards.splice(at, 1)
    player.islandTurnsLeft = 0
    emit(ctx, { type: 'CARD_USED', playerId: player.id, card })
    emit(ctx, { type: 'ISLAND_ESCAPED', playerId: player.id, method: 'CARD' })
    return
  }

  const pending = t.pending
  ensure(pending?.type === 'RENT', 'Chỉ dùng Lá Chắn khi phải trả tiền thuê')
  player.heldCards.splice(at, 1)
  t.pending = null
  emit(ctx, { type: 'CARD_USED', playerId: player.id, card })
  emit(ctx, { type: 'RENT_WAIVED', from: player.id, to: pending.to, tileIndex: pending.tileIndex, amount: pending.amount })
  afterRent(ctx, pending.tileIndex)
}

function sell(ctx: Ctx, tileIndex: number): void {
  const s = ctx.s
  ensure(s.turn.pending?.type === 'DEBT', 'Chỉ bán tài sản khi thiếu tiền')
  ensure(isValidTileIndex(tileIndex), 'Ô không tồn tại')
  const player = currentPlayer(s)
  ensure(s.tiles[tileIndex].owner === player.id, 'Không phải tài sản của bạn')

  const amount = sellValue(s, tileIndex)
  player.money += amount
  s.tiles[tileIndex] = { owner: null, level: 0 }
  if (s.festivalTile === tileIndex) s.festivalTile = null
  emit(ctx, { type: 'PROPERTY_SOLD', playerId: player.id, tileIndex, amount })
  settleDebtIfPossible(ctx)
}

function endTurn(ctx: Ctx): void {
  ensureFreeToAct(ctx)
  const s = ctx.s
  const player = currentPlayer(s)
  if (s.turn.extraRoll && player.islandTurnsLeft === 0) {
    emit(ctx, { type: 'EXTRA_ROLL', playerId: player.id })
    s.turn = { ...freshTurn(), doublesCount: s.turn.doublesCount }
    return
  }
  advanceTurn(ctx)
}

function hostFestival(ctx: Ctx, tileIndex: number): void {
  ensureFreeToAct(ctx)
  const s = ctx.s
  const player = currentPlayer(s)
  ensure(s.turn.festivalChoice, 'Chỉ tổ chức Lễ Hội khi dừng ở ô Lễ Hội')
  ensure(isValidTileIndex(tileIndex), 'Ô không tồn tại')
  ensure(tileDef(tileIndex).kind === 'CITY' && s.tiles[tileIndex].owner === player.id, 'Chọn một thành phố của mình')
  const previousTile = s.festivalTile
  s.festivalTile = tileIndex
  s.turn.festivalChoice = false
  emit(ctx, { type: 'FESTIVAL_HOSTED', playerId: player.id, tileIndex, previousTile })
}

function fly(ctx: Ctx, tileIndex: number): void {
  const s = ctx.s
  const t = s.turn
  const player = currentPlayer(s)
  ensure(t.step === 'ROLL' && t.pending === null, 'Chỉ bay được ở đầu lượt')
  ensure(player.airportTicket, 'Không có vé Sân Bay')
  ensure(isValidTileIndex(tileIndex) && tileIndex !== AIRPORT_INDEX, 'Điểm đến không hợp lệ')
  const fee = ECONOMY.airport.flightFee
  ensure(player.money >= fee, 'Không đủ tiền bay')

  player.money -= fee
  player.airportTicket = false
  emit(ctx, { type: 'MONEY_PAID', from: player.id, to: null, amount: fee, reason: 'FLIGHT' })
  t.dice = null
  t.extraRoll = false
  t.step = 'ACT'
  moveTo(ctx, tileIndex, 'FLY')
  landOn(ctx)
}

function payIslandFee(ctx: Ctx): void {
  const s = ctx.s
  const player = currentPlayer(s)
  ensure(s.turn.step === 'ROLL' && player.islandTurnsLeft > 0, 'Không ở Đảo Hoang')
  const fee = ECONOMY.island.escapeFee
  ensure(player.money >= fee, 'Không đủ tiền thoát đảo')
  player.money -= fee
  player.islandTurnsLeft = 0
  emit(ctx, { type: 'MONEY_PAID', from: player.id, to: null, amount: fee, reason: 'ISLAND_FEE' })
  emit(ctx, { type: 'ISLAND_ESCAPED', playerId: player.id, method: 'FEE' })
}

function earthquake(ctx: Ctx, tileIndex: number): void {
  const s = ctx.s
  ensure(s.turn.pending?.type === 'EARTHQUAKE', 'Không có thẻ Động Đất cần xử lý')
  const player = currentPlayer(s)
  ensure(isValidTileIndex(tileIndex) && isEarthquakeTarget(s, player.id, tileIndex), 'Chọn thành phố có nhà của đối thủ')
  const tile = s.tiles[tileIndex]
  const owner = tile.owner
  ensure(owner !== null, 'Ô chưa có chủ')
  tile.level--
  s.turn.pending = null
  emit(ctx, { type: 'HOUSE_DESTROYED', byPlayerId: player.id, owner, tileIndex, level: tile.level })
}
