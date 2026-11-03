/** Tiện ích cho unit test: dựng state, ép xúc xắc/thẻ qua RNG (không có cửa sau trong reducer). */
import { BOARD_SIZE } from '../config/board'
import { CARD_IDS, type CardId } from '../config/cards'
import { currentPlayer } from './context'
import { createGame } from './game'
import { applyAction } from './reducer'
import { nextRandom, toDie } from './rng'
import type { ActionResult, GameAction, GameEvent, GameState, PlayerId } from './types'

export function newGame(players = 2, seed = 1): GameState {
  return createGame(
    Array.from({ length: players }, (_, i) => ({ name: ['An', 'Bình', 'Chi', 'Dũng'][i] })),
    seed,
  )
}

/** Tìm trạng thái RNG để lần ROLL_DICE kế tiếp ra đúng (d1, d2). */
export function rngStateForDice(d1: number, d2: number): number {
  for (let s = 1; s < 1_000_000; s++) {
    const [v1, s1] = nextRandom(s)
    if (toDie(v1) !== d1) continue
    const [v2] = nextRandom(s1)
    if (toDie(v2) === d2) return s
  }
  throw new Error('Không tìm được seed')
}

/** Tìm trạng thái RNG để lần DRAW_CARD kế tiếp ra đúng thẻ. */
export function rngStateForCard(card: CardId): number {
  for (let s = 1; s < 1_000_000; s++) {
    const [v] = nextRandom(s)
    if (CARD_IDS[Math.floor(v * CARD_IDS.length)] === card) return s
  }
  throw new Error('Không tìm được seed')
}

export function patch(state: GameState, fn: (s: GameState) => void): GameState {
  const copy = structuredClone(state)
  fn(copy)
  return copy
}

export function withDice(state: GameState, d1: number, d2: number): GameState {
  return patch(state, (s) => {
    s.rngState = rngStateForDice(d1, d2)
  })
}

export function withCard(state: GameState, card: CardId): GameState {
  return patch(state, (s) => {
    s.rngState = rngStateForCard(card)
  })
}

export const pid = (state: GameState): PlayerId => currentPlayer(state).id

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
/** Action không cần playerId — mặc định là người đang tới lượt. */
export type ActionInput = DistributiveOmit<GameAction, 'playerId'> & { playerId?: PlayerId }

export function act(state: GameState, action: ActionInput): ActionResult {
  return applyAction(state, { ...action, playerId: action.playerId ?? pid(state) } as GameAction)
}

/** Áp dụng lần lượt nhiều action của người đang tới lượt, gộp event. */
export function run(state: GameState, ...actions: ActionInput[]): ActionResult {
  let current = state
  const events: GameEvent[] = []
  for (const action of actions) {
    const result = act(current, action)
    current = result.state
    events.push(...result.events)
  }
  return { state: current, events }
}

/** Đặt người đang tới lượt cách `target` đúng d1+d2 ô rồi tung + đi để dừng ở `target`. */
export function arrive(state: GameState, target: number, dice: [number, number] = [1, 2]): ActionResult {
  const steps = dice[0] + dice[1]
  const prepared = patch(withDice(state, dice[0], dice[1]), (s) => {
    s.players[s.currentPlayerIndex].position = (target - steps + BOARD_SIZE) % BOARD_SIZE
  })
  return run(prepared, { type: 'ROLL_DICE' }, { type: 'MOVE' })
}

/** Gán quyền sở hữu nhiều ô cho một người. */
export function own(state: GameState, playerId: PlayerId, tiles: number[], level = 0): GameState {
  return patch(state, (s) => {
    for (const i of tiles) s.tiles[i] = { owner: playerId, level }
  })
}

export function setMoney(state: GameState, playerId: PlayerId, money: number): GameState {
  return patch(state, (s) => {
    const p = s.players.find((x) => x.id === playerId)
    if (p) p.money = money
  })
}

export function eventsOf<T extends GameEvent['type']>(events: GameEvent[], type: T): Extract<GameEvent, { type: T }>[] {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type)
}

export function player(state: GameState, id: PlayerId) {
  const p = state.players.find((x) => x.id === id)
  if (!p) throw new Error(`Không có ${id}`)
  return p
}

/** Bất biến luôn đúng: không ai âm tiền, chủ sở hữu hợp lệ, cấp ô hợp lệ. */
export function assertInvariants(state: GameState): void {
  for (const p of state.players) {
    if (p.money < 0) throw new Error(`${p.id} âm tiền: ${p.money}`)
    if (p.bankrupt && state.tiles.some((t) => t.owner === p.id)) throw new Error(`${p.id} phá sản mà còn đất`)
  }
  for (const t of state.tiles) {
    if (t.level < 0 || t.level > 4) throw new Error(`Cấp ô sai: ${t.level}`)
    if (t.owner === null && t.level !== 0) throw new Error('Ô không chủ mà có nhà')
  }
}
