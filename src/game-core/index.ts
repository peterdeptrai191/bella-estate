/**
 * game-core: toàn bộ luật chơi, TypeScript thuần.
 * KHÔNG import React, Three.js, Zustand hay bất kỳ thứ gì phụ thuộc trình duyệt.
 *
 * Cách dùng:
 *   let state = createGame([{ name: 'An' }, { name: 'Bot', isBot: true }], seed)
 *   const { state: next, events } = applyAction(state, { type: 'ROLL_DICE', playerId: 'p1' })
 */
export * from './types'
export { createGame, MIN_PLAYERS, MAX_PLAYERS, type NewPlayer } from './game'
export { applyAction } from './reducer'
export { GameRuleError, currentPlayer } from './context'
export { getLegalActions, getTimeoutAction, isLegal } from './legalActions'
export { findInstantWinner } from './win'
export { describeEvent, formatMoney } from './describe'
export { nextRandom, seedToRngState } from './rng'
export {
  AIRPORT_INDEX,
  CITY_INDICES,
  FESTIVAL_INDEX,
  ISLAND_INDEX,
  LANDMARK_LEVEL,
  RESORT_INDICES,
  START_INDEX,
  groupTiles,
  isPurchasable,
  sidePurchasableTiles,
} from './board'
export {
  buildCost,
  buyoutPrice,
  completedGroups,
  housesOwned,
  investedValue,
  landPrice,
  type Ownership,
  liquidationValue,
  netWorth,
  ownedTiles,
  rentFor,
  sellValue,
  standings,
} from './valuation'
export { isEarthquakeTarget } from './cards'
export { chooseBotAction, type BotLevel } from './bot'
export { autoAction, humanPrompt, type HumanPrompt } from './flow'
