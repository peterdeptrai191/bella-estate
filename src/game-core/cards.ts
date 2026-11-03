/** Hiệu ứng 10 thẻ Cơ Hội (GDD mục 6). */
import { CARD_IDS, type CardId } from '../config/cards'
import { ECONOMY } from '../config/economy'
import { CITY_INDICES, FESTIVAL_INDEX, START_INDEX } from './board'
import { type Ctx, currentPlayer, emit, random } from './context'
import { charge } from './money'
import { landOn, moveTo, sendToIsland } from './movement'
import type { GameState, PlayerId } from './types'
import { housesOwned } from './valuation'

export function drawRandomCard(ctx: Ctx): CardId {
  return CARD_IDS[Math.floor(random(ctx) * CARD_IDS.length)]
}

/** Ô có thể bị Động Đất: thành phố của đối thủ có 1–3 nhà (không phải Landmark). */
export function isEarthquakeTarget(s: GameState, playerId: PlayerId, i: number): boolean {
  const tile = s.tiles[i]
  return (
    CITY_INDICES.includes(i) &&
    tile.owner !== null &&
    tile.owner !== playerId &&
    tile.level >= 1 &&
    tile.level <= ECONOMY.city.maxHouses
  )
}

export function resolveCard(ctx: Ctx, card: CardId): void {
  const s = ctx.s
  const player = currentPlayer(s)
  switch (card) {
    case 'ESCAPE_ISLAND':
    case 'SHIELD':
      player.heldCards.push(card)
      return
    case 'DISCOUNT':
      player.rentDiscount = true
      return
    case 'GO_TO_START':
      moveTo(ctx, START_INDEX, 'TELEPORT')
      landOn(ctx)
      return
    case 'GO_TO_FESTIVAL':
      moveTo(ctx, FESTIVAL_INDEX, 'TELEPORT')
      landOn(ctx)
      return
    case 'EARTHQUAKE':
      if (CITY_INDICES.some((i) => isEarthquakeTarget(s, player.id, i))) {
        s.turn.pending = { type: 'EARTHQUAKE' }
      }
      return
    case 'GO_TO_ISLAND':
      sendToIsland(ctx, 'CARD')
      return
    case 'SURPRISE_TAX':
      charge(
        ctx,
        [{ to: null, amount: housesOwned(s, player.id) * ECONOMY.cards.surpriseTaxPerHouse }],
        'SURPRISE_TAX',
      )
      return
    case 'CHARITY':
      charge(
        ctx,
        s.players
          .filter((p) => !p.bankrupt && p.id !== player.id)
          .map((p) => ({ to: p.id, amount: ECONOMY.cards.charityPerPlayer })),
        'CHARITY',
      )
      return
    case 'LOTTERY':
      player.money += ECONOMY.cards.lotteryPrize
      emit(ctx, { type: 'MONEY_RECEIVED', playerId: player.id, amount: ECONOMY.cards.lotteryPrize, reason: 'LOTTERY' })
      return
  }
}
