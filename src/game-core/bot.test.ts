import { describe, expect, it } from 'vitest'
import { BOT_LEVELS, BOTS } from '../config/bots'
import { ECONOMY } from '../config/economy'
import { chooseBotAction } from './bot'
import { isLegal } from './legalActions'
import { applyAction } from './reducer'
import { assertInvariants, newGame, patch, pid, withDice } from './testHelpers'
import type { GameState } from './types'

const reserve = BOTS.normal.cashReserve

/** Đưa người đang tới lượt tới ô `tile` bằng xúc xắc ép sẵn, rồi dừng ở bước ACT. */
function landOnTile(state: GameState, from: number, tile: number): GameState {
  const steps = tile - from
  const d1 = Math.min(6, steps - 1)
  let s = patch(state, (g) => {
    g.players[g.currentPlayerIndex].position = from
  })
  s = withDice(s, d1, steps - d1)
  s = applyAction(s, { type: 'ROLL_DICE', playerId: pid(s) }).state
  return applyAction(s, { type: 'MOVE', playerId: pid(s) }).state
}

describe('Bot cả 3 mức', () => {
  it.each(BOT_LEVELS.flatMap((level) => [1, 2, 3].map((seed) => [level, seed] as const)))(
    'mức %s, seed %i: ván toàn bot luôn chơi hết, mọi quyết định hợp lệ',
    (level, seed) => {
      let state = newGame(2 + (seed % 3), seed)
      for (let step = 0; step < 20_000 && state.phase === 'playing'; step++) {
        const action = chooseBotAction(state, level)
        expect(action).not.toBeNull()
        if (!action) break
        expect(isLegal(state, action)).toBe(true)
        state = applyAction(state, action).state
      }
      expect(state.phase).toBe('finished')
    },
  )

  it('bot Dễ mua khoảng 60% số lần có thể mua', () => {
    let bought = 0
    let total = 0
    for (let seed = 1; seed <= 300; seed++) {
      const state = patch(landOnTile(newGame(2, seed), 0, 6), (g) => {
        g.rngState = seed * 7919
      })
      total++
      if (chooseBotAction(state, 'easy')?.type === 'BUY') bought++
    }
    expect(bought / total).toBeGreaterThan(0.48)
    expect(bought / total).toBeLessThan(0.72)
  })

  it('bot Khó chấp nhận ít tiền dự trữ để chặn đối thủ sắp gom trọn nhóm; bot Thường thì không', () => {
    let state = newGame(2, 1)
    state = patch(state, (g) => {
      g.tiles[7] = { owner: g.players[1].id, level: 0 }
      g.tiles[9] = { owner: g.players[1].id, level: 0 }
    })
    state = landOnTile(state, 0, 6)
    state = patch(state, (g) => {
      g.players[0].money = ECONOMY.groupPrices.lightBlue + BOTS.hard.strategicReserve + 10
    })
    expect(chooseBotAction(state, 'hard')).toMatchObject({ type: 'BUY' })
    expect(chooseBotAction(state, 'normal')).toMatchObject({ type: 'END_TURN' })
  })

  it('bot Khó mua lại để phá thế độc quyền nhóm màu của đối thủ đang có 2 nhóm', () => {
    let state = newGame(2, 1)
    state = patch(state, (g) => {
      const opp = g.players[1].id
      for (const i of [1, 2, 4, 6, 7, 9]) g.tiles[i] = { owner: opp, level: 0 }
    })
    state = landOnTile(state, 0, 6)
    state = applyAction(state, { type: 'PAY_RENT', playerId: pid(state) }).state
    expect(chooseBotAction(state, 'hard')).toMatchObject({ type: 'BUYOUT' })
  })
})

describe('Bot mức Thường', () => {
  it.each([4, 5, 6])('seed %i: ván toàn bot luôn chơi hết, bất biến luôn đúng', (seed) => {
    let state = newGame(2 + (seed % 3), seed)
    for (let step = 0; step < 20_000 && state.phase === 'playing'; step++) {
      const action = chooseBotAction(state)
      expect(action).not.toBeNull()
      if (!action) break
      expect(isLegal(state, action)).toBe(true)
      state = applyAction(state, action).state
      assertInvariants(state)
    }
    expect(state.phase).toBe('finished')
  })

  it('cùng state thì cùng quyết định (không ngẫu nhiên)', () => {
    const state = landOnTile(newGame(2, 9), 0, 6)
    expect(chooseBotAction(state)).toEqual(chooseBotAction(state))
  })

  it('mua đất khi sau khi mua vẫn còn ít nhất phần tiền dự trữ', () => {
    const state = landOnTile(newGame(2, 1), 0, 6)
    expect(chooseBotAction(state)).toMatchObject({ type: 'BUY' })
  })

  it('không mua nếu mua xong còn ít hơn phần tiền dự trữ', () => {
    const base = landOnTile(newGame(2, 1), 0, 6)
    const price = ECONOMY.groupPrices.lightBlue
    const poor = patch(base, (g) => {
      g.players[g.currentPlayerIndex].money = price + reserve - 1
    })
    expect(chooseBotAction(poor)).toMatchObject({ type: 'END_TURN' })
  })

  it('có Lá Chắn thì dùng thay vì trả tiền thuê', () => {
    let state = newGame(2, 1)
    state = patch(state, (g) => {
      g.tiles[6] = { owner: g.players[1].id, level: 2 }
      g.players[0].heldCards = ['SHIELD']
    })
    state = landOnTile(state, 0, 6)
    expect(state.turn.pending?.type).toBe('RENT')
    expect(chooseBotAction(state)).toEqual({ type: 'USE_CARD', playerId: pid(state), card: 'SHIELD' })
  })

  it('mua lại ô của đối thủ khi ô đó giúp gom trọn nhóm màu', () => {
    let state = newGame(2, 1)
    state = patch(state, (g) => {
      g.tiles[6] = { owner: g.players[1].id, level: 0 }
      g.tiles[7] = { owner: g.players[0].id, level: 0 }
      g.tiles[9] = { owner: g.players[0].id, level: 0 }
    })
    state = landOnTile(state, 0, 6)
    state = applyAction(state, { type: 'PAY_RENT', playerId: pid(state) }).state
    expect(chooseBotAction(state)).toMatchObject({ type: 'BUYOUT' })
  })

  it('đang nợ thì bán ô ngoài nhóm màu đã gom đủ trước', () => {
    let state = newGame(2, 1)
    state = patch(state, (g) => {
      const me = g.players[0].id
      g.tiles[1] = { owner: me, level: 0 }
      g.tiles[2] = { owner: me, level: 0 }
      g.tiles[4] = { owner: me, level: 0 }
      g.tiles[10] = { owner: me, level: 0 }
      g.tiles[6] = { owner: g.players[1].id, level: 3 }
    })
    state = landOnTile(state, 0, 6)
    const pending = state.turn.pending
    if (pending?.type !== 'RENT') throw new Error('phải có tiền thuê')
    state = patch(state, (g) => {
      g.players[0].money = pending.amount - 1
    })
    state = applyAction(state, { type: 'PAY_RENT', playerId: pid(state) }).state
    expect(state.turn.pending?.type).toBe('DEBT')
    expect(chooseBotAction(state)).toEqual({ type: 'SELL', playerId: pid(state), tileIndex: 10 })
  })
})
