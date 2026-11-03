import { describe, expect, it } from 'vitest'
import { groupTiles, ISLAND_INDEX } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, own, patch, player, run, withDice } from './testHelpers'

const [, , B3] = groupTiles('brown')

describe('Tung xúc xắc và di chuyển (GDD mục 2)', () => {
  it('ROLL_DICE rồi MOVE: đi đúng tổng hai xúc xắc', () => {
    const { state, events } = run(withDice(newGame(), 2, 4), { type: 'ROLL_DICE' }, { type: 'MOVE' })
    expect(player(state, 'p1').position).toBe(6)
    expect(eventsOf(events, 'DICE_ROLLED')[0]).toMatchObject({ dice: [2, 4], isDouble: false })
    expect(eventsOf(events, 'PLAYER_MOVED')[0]).toMatchObject({ from: 0, to: 6, steps: 6, mode: 'WALK' })
  })

  it('không được đi trước khi tung, không được hành động khi chưa tới lượt', () => {
    expect(() => act(newGame(), { type: 'MOVE' })).toThrow(GameRuleError)
    expect(() => act(newGame(), { type: 'ROLL_DICE', playerId: 'p2' })).toThrow(GameRuleError)
  })

  it('đi qua Xuất Phát nhận +200', () => {
    const start = patch(newGame(), (s) => (s.players[0].position = 30))
    const { state, events } = run(withDice(start, 2, 3), { type: 'ROLL_DICE' }, { type: 'MOVE' })
    expect(player(state, 'p1').position).toBe(3)
    expect(player(state, 'p1').money).toBe(1700)
    expect(eventsOf(events, 'PASSED_START')).toHaveLength(1)
  })

  it('dừng đúng Xuất Phát: +200 và được xây 1 nhà miễn phí lên đất bất kỳ của mình', () => {
    const { state, events } = arrive(own(newGame(), 'p1', [B3], 1), 0)
    expect(player(state, 'p1').money).toBe(1700)
    expect(eventsOf(events, 'FREE_HOUSE_AVAILABLE')).toHaveLength(1)
    const built = act(state, { type: 'BUILD', tileIndex: B3 })
    expect(built.state.tiles[B3].level).toBe(2)
    expect(player(built.state, 'p1').money).toBe(1700)
    expect(eventsOf(built.events, 'BUILT')[0]).toMatchObject({ free: true, cost: 0 })
    // Chỉ được 1 nhà miễn phí.
    expect(() => act(built.state, { type: 'BUILD', tileIndex: B3 })).toThrow(GameRuleError)
  })

  it('kết thúc lượt chuyển sang người kế tiếp; hết một vòng thì tăng số vòng', () => {
    let { state } = arrive(newGame(), 6)
    state = act(state, { type: 'END_TURN' }).state
    expect(state.currentPlayerIndex).toBe(1)
    expect(state.round).toBe(1)
    state = arrive(state, 6).state
    const { state: next, events } = act(state, { type: 'END_TURN' })
    expect(next.currentPlayerIndex).toBe(0)
    expect(next.round).toBe(2)
    expect(eventsOf(events, 'TURN_STARTED')[0]).toMatchObject({ playerId: 'p1', round: 2 })
  })
})

describe('Luật đôi', () => {
  it('tung ra đôi: được tung thêm một lần', () => {
    const { state } = arrive(newGame(), 6, [3, 3])
    const { state: next, events } = act(state, { type: 'END_TURN' })
    expect(eventsOf(events, 'EXTRA_ROLL')).toHaveLength(1)
    expect(next.currentPlayerIndex).toBe(0)
    expect(next.turn.step).toBe('ROLL')
    expect(next.turn.doublesCount).toBe(1)
  })

  it('ra đôi 3 lần liên tiếp: vào thẳng Đảo Hoang, không đi, hết lượt', () => {
    const twoDoubles = patch(newGame(), (s) => {
      s.turn.doublesCount = 2
      s.players[0].position = 4
    })
    const { state, events } = act(withDice(twoDoubles, 5, 5), { type: 'ROLL_DICE' })
    expect(player(state, 'p1').position).toBe(ISLAND_INDEX)
    expect(player(state, 'p1').islandTurnsLeft).toBe(3)
    expect(eventsOf(events, 'SENT_TO_ISLAND')[0].reason).toBe('THREE_DOUBLES')
    const ended = act(state, { type: 'END_TURN' })
    expect(ended.state.currentPlayerIndex).toBe(1)
  })

  it('đôi rồi bị đưa ra đảo: mất lượt tung thêm', () => {
    const { state } = arrive(newGame(), ISLAND_INDEX, [2, 2])
    expect(state.turn.extraRoll).toBe(false)
    expect(act(state, { type: 'END_TURN' }).state.currentPlayerIndex).toBe(1)
  })
})
