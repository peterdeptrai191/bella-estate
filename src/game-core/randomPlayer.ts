/**
 * Người chơi chọn ngẫu nhiên có trọng số (RNG có seed) — dùng cho giả lập và chơi thử.
 * KHÔNG phải bot AI của GDD mục 7.
 */
import { currentPlayer } from './context'
import { getLegalActions } from './legalActions'
import { nextRandom } from './rng'
import type { GameAction, GameState } from './types'

export type Policy = (state: GameState, legal: GameAction[]) => GameAction

export function createRandomPlayer(seed: number): Policy {
  let rngState = seed ^ 0x5bd1e995
  const rand = () => {
    const [v, next] = nextRandom(rngState)
    rngState = next
    return v
  }
  const pickOne = <T>(items: T[]): T => items[Math.floor(rand() * items.length)]

  return (state, legal) => {
    const of = <K extends GameAction['type']>(type: K) =>
      legal.filter((a): a is Extract<GameAction, { type: K }> => a.type === type)
    const me = currentPlayer(state)

    if (legal.length === 1) return legal[0]
    const shield = of('USE_CARD').find((a) => a.card === 'SHIELD')
    if (shield && rand() < 0.8) return shield
    if (of('PAY_RENT').length) return of('PAY_RENT')[0]
    if (of('SELL').length) return pickOne(of('SELL'))
    if (of('EARTHQUAKE').length) return pickOne(of('EARTHQUAKE'))

    if (of('FLY').length && rand() < 0.6) return pickOne(of('FLY'))
    const escapeCard = of('USE_CARD').find((a) => a.card === 'ESCAPE_ISLAND')
    if (escapeCard && rand() < 0.7) return escapeCard
    if (of('PAY_ISLAND_FEE').length && rand() < 0.3) return of('PAY_ISLAND_FEE')[0]
    if (of('ROLL_DICE').length) return of('ROLL_DICE')[0]

    const reserve = me.money > 400
    if (of('HOST_FESTIVAL').length) return pickOne(of('HOST_FESTIVAL'))
    if (of('BUYOUT').length && reserve && rand() < 0.4) return of('BUYOUT')[0]
    if (of('BUY').length && rand() < 0.8) return of('BUY')[0]
    if (of('BUILD').length && (state.turn.freeHouse || (reserve && rand() < 0.6))) return pickOne(of('BUILD'))
    return of('END_TURN')[0] ?? legal[0]
  }
}

/** Chọn action kế tiếp cho người đang tới lượt. null nếu ván đã kết thúc. */
export function nextRandomAction(state: GameState, policy: Policy): GameAction | null {
  const legal = getLegalActions(state)
  return legal.length ? policy(state, legal) : null
}
