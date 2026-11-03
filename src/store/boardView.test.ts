import { describe, expect, it } from 'vitest'
import { applyAction, createGame, type GameState } from '../game-core'
import { createRandomPlayer, nextRandomAction } from '../game-core/randomPlayer'
import { applyEventToView, viewFromGame, type BoardView } from './boardView'

/** Phần view phải khớp tuyệt đối với game-core (bỏ xúc xắc vì lượt mới xóa dice trong game-core). */
function comparable(view: BoardView) {
  const { dice: _dice, ...rest } = view
  return rest
}

describe('Phát lại event lên view', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i: view sau khi phát hết event khớp state game-core', (seed) => {
    let state: GameState = createGame(
      ['An', 'Bình', 'Chi', 'Dũng'].map((name) => ({ name })),
      seed,
    )
    let view = viewFromGame(state)
    const policy = createRandomPlayer(seed)
    for (let step = 0; step < 20_000 && state.phase === 'playing'; step++) {
      const action = nextRandomAction(state, policy)
      if (!action) break
      const result = applyAction(state, action)
      state = result.state
      for (const event of result.events) view = applyEventToView(view, event)
      expect(comparable(view)).toEqual(comparable(viewFromGame(state)))
    }
    expect(state.phase).toBe('finished')
  })
})
