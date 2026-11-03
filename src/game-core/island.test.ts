import { describe, expect, it } from 'vitest'
import { ISLAND_INDEX } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, patch, player, run, setMoney, withDice } from './testHelpers'

const onIsland = (turnsLeft = 3) =>
  patch(newGame(), (s) => {
    s.players[0].position = ISLAND_INDEX
    s.players[0].islandTurnsLeft = turnsLeft
  })

describe('Đảo Hoang', () => {
  it('dừng ở Đảo Hoang thì bị kẹt tối đa 3 lượt', () => {
    const { state, events } = arrive(newGame(), ISLAND_INDEX)
    expect(player(state, 'p1').islandTurnsLeft).toBe(3)
    expect(eventsOf(events, 'SENT_TO_ISLAND')[0].reason).toBe('TILE')
  })

  it('tung không ra đôi: ở lại, giảm số lượt còn lại', () => {
    const { state, events } = act(withDice(onIsland(), 1, 2), { type: 'ROLL_DICE' })
    expect(player(state, 'p1').position).toBe(ISLAND_INDEX)
    expect(player(state, 'p1').islandTurnsLeft).toBe(2)
    expect(eventsOf(events, 'ISLAND_STAY')[0].turnsLeft).toBe(2)
    expect(() => act(state, { type: 'MOVE' })).toThrow(GameRuleError)
    expect(act(state, { type: 'END_TURN' }).state.currentPlayerIndex).toBe(1)
  })

  it('sau 3 lượt kẹt thì lượt sau tự do tung bình thường', () => {
    const third = act(withDice(onIsland(1), 1, 2), { type: 'ROLL_DICE' }).state
    expect(player(third, 'p1').islandTurnsLeft).toBe(0)
    const nextTurn = patch(third, (s) => {
      s.turn = { ...s.turn, step: 'ROLL', dice: null }
    })
    const moved = run(withDice(nextTurn, 1, 2), { type: 'ROLL_DICE' }, { type: 'MOVE' })
    expect(player(moved.state, 'p1').position).toBe(ISLAND_INDEX + 3)
  })

  it('tung được đôi: thoát đảo và đi luôn, nhưng không được tung thêm', () => {
    const { state, events } = run(withDice(onIsland(), 4, 4), { type: 'ROLL_DICE' }, { type: 'MOVE' })
    expect(eventsOf(events, 'ISLAND_ESCAPED')[0].method).toBe('DOUBLES')
    expect(player(state, 'p1').position).toBe(ISLAND_INDEX + 8)
    expect(state.turn.extraRoll).toBe(false)
  })

  it('trả 100 để thoát rồi tung bình thường', () => {
    const paid = act(onIsland(), { type: 'PAY_ISLAND_FEE' })
    expect(player(paid.state, 'p1').money).toBe(1400)
    expect(player(paid.state, 'p1').islandTurnsLeft).toBe(0)
    const moved = run(withDice(paid.state, 1, 2), { type: 'ROLL_DICE' }, { type: 'MOVE' })
    expect(player(moved.state, 'p1').position).toBe(ISLAND_INDEX + 3)
  })

  it('không đủ tiền thì không trả phí thoát đảo được', () => {
    expect(() => act(setMoney(onIsland(), 'p1', 50), { type: 'PAY_ISLAND_FEE' })).toThrow(GameRuleError)
  })

  it('dùng thẻ "Ra Đảo" để thoát', () => {
    const withCard = patch(onIsland(), (s) => (s.players[0].heldCards = ['ESCAPE_ISLAND']))
    const { state, events } = act(withCard, { type: 'USE_CARD', card: 'ESCAPE_ISLAND' })
    expect(player(state, 'p1').islandTurnsLeft).toBe(0)
    expect(player(state, 'p1').heldCards).toEqual([])
    expect(eventsOf(events, 'ISLAND_ESCAPED')[0].method).toBe('CARD')
    expect(() => act(onIsland(), { type: 'USE_CARD', card: 'ESCAPE_ISLAND' })).toThrow(GameRuleError)
  })
})
