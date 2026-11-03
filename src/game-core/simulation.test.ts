import { describe, expect, it } from 'vitest'
import { getLegalActions, getTimeoutAction, isLegal } from './legalActions'
import { applyAction } from './reducer'
import { nextRandom } from './rng'
import { assertInvariants, newGame } from './testHelpers'
import type { GameAction, GameState } from './types'

/** Chơi một ván bằng cách chọn ngẫu nhiên (có seed) trong các action hợp lệ. */
function playRandomGame(players: number, seed: number, maxSteps = 20_000) {
  let state = newGame(players, seed)
  let decision = seed * 7919
  const history: GameAction[] = []
  for (let step = 0; step < maxSteps && state.phase === 'playing'; step++) {
    const legal = getLegalActions(state)
    expect(legal.length).toBeGreaterThan(0)
    const [r, next] = nextRandom(decision)
    decision = next
    const action = legal[Math.floor(r * legal.length)]
    history.push(action)
    state = applyAction(state, action).state
    assertInvariants(state)
  }
  return { state, history }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

describe('Reducer thuần và replay', () => {
  it('không sửa state đầu vào', () => {
    let state = newGame(4, 3)
    for (let i = 0; i < 300 && state.phase === 'playing'; i++) {
      const frozen = deepFreeze(structuredClone(state))
      const action = getLegalActions(frozen)[0]
      state = applyAction(frozen, action).state
    }
  })

  it('cùng seed + cùng chuỗi action cho cùng kết quả', () => {
    const a = playRandomGame(4, 11)
    const b = playRandomGame(4, 11)
    expect(a.state).toEqual(b.state)

    let replay: GameState = newGame(4, 11)
    for (const action of a.history) replay = applyAction(replay, action).state
    expect(replay).toEqual(a.state)
  })
})

describe('Giả lập nhiều ván ngẫu nhiên', () => {
  it.each(Array.from({ length: 12 }, (_, i) => i + 1))('seed %i: ván luôn kết thúc, bất biến luôn đúng', (seed) => {
    const { state } = playRandomGame(2 + (seed % 3), seed)
    expect(state.phase).toBe('finished')
    expect(state.winner).not.toBeNull()
  })

  it('chỉ dùng action hết giờ vẫn chơi hết ván (kết thúc khi hết vòng)', () => {
    let state = newGame(4, 5)
    for (let i = 0; i < 20_000 && state.phase === 'playing'; i++) {
      const action = getTimeoutAction(state)
      expect(action).not.toBeNull()
      if (!action) break
      expect(isLegal(state, action)).toBe(true)
      state = applyAction(state, action).state
    }
    expect(state.phase).toBe('finished')
    expect(state.winReason).toBe('ROUND_LIMIT')
  })
})
