import { describe, expect, it } from 'vitest'
import { groupTiles } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, own, player, setMoney } from './testHelpers'

const [, , B3] = groupTiles('brown') // P = 60
const [R1] = groupTiles('red') // P = 220
const [Y1] = groupTiles('yellow') // P = 260

describe('Thiếu tiền: bắt buộc bán tài sản 50%', () => {
  // p2 có Đỏ 3 nhà: tiền thuê 2P = 440. p1 chỉ có 100 tiền mặt.
  const setup = () =>
    setMoney(own(own(own(newGame(), 'p2', [R1], 3), 'p1', [Y1], 3), 'p1', [B3], 3), 'p1', 100)

  it('không đủ tiền mặt nhưng bán tài sản đủ bù: vào trạng thái nợ', () => {
    const { state } = arrive(setup(), R1)
    const { state: debt, events } = act(state, { type: 'PAY_RENT' })
    expect(debt.turn.pending?.type).toBe('DEBT')
    expect(eventsOf(events, 'DEBT_STARTED')[0]).toMatchObject({ amount: 440, reason: 'RENT' })
    expect(() => act(debt, { type: 'END_TURN' })).toThrow(GameRuleError)
  })

  it('bán cho ngân hàng được 50% giá trị; đủ tiền thì tự trả nợ', () => {
    const debt = act(arrive(setup(), R1).state, { type: 'PAY_RENT' }).state
    const sold1 = act(debt, { type: 'SELL', tileIndex: Y1 })
    expect(eventsOf(sold1.events, 'PROPERTY_SOLD')[0].amount).toBe(325) // (260 + 3x130) / 2
    expect(sold1.state.tiles[Y1]).toEqual({ owner: null, level: 0 })
    expect(sold1.state.turn.pending?.type).toBe('DEBT')

    const sold2 = act(sold1.state, { type: 'SELL', tileIndex: B3 })
    expect(sold2.state.turn.pending).toBeNull()
    expect(eventsOf(sold2.events, 'RENT_PAID')[0].amount).toBe(440)
    expect(player(sold2.state, 'p1').money).toBe(100 + 325 + 75 - 440)
    expect(player(sold2.state, 'p2').money).toBe(1500 + 440)
    expect(() => act(sold2.state, { type: 'END_TURN' })).not.toThrow()
  })

  it('không thiếu tiền thì không được bán', () => {
    const { state } = arrive(own(newGame(), 'p1', [B3]), 6)
    expect(() => act(state, { type: 'SELL', tileIndex: B3 })).toThrow(GameRuleError)
  })
})

describe('Phá sản', () => {
  it('bán hết vẫn không đủ: phá sản, chủ nợ nhận phần còn lại, đất trả về ngân hàng', () => {
    const s = setMoney(own(own(newGame(3), 'p2', [R1], 3), 'p1', [B3]), 'p1', 10)
    const { state } = arrive(s, R1)
    const { state: next, events } = act(state, { type: 'PAY_RENT' })
    expect(player(next, 'p1').bankrupt).toBe(true)
    expect(player(next, 'p1').money).toBe(0)
    expect(player(next, 'p2').money).toBe(1500 + 10 + 30)
    expect(next.tiles[B3]).toEqual({ owner: null, level: 0 })
    expect(eventsOf(events, 'BANKRUPT')[0]).toMatchObject({ playerId: 'p1', releasedTiles: [B3] })
    // Lượt chuyển cho người kế tiếp, ván vẫn tiếp tục với 2 người.
    expect(next.phase).toBe('playing')
    expect(next.currentPlayerIndex).toBe(1)
    expect(eventsOf(events, 'TURN_STARTED')[0].playerId).toBe('p2')
  })

  it('người phá sản bị bỏ qua khi chuyển lượt', () => {
    const s = setMoney(own(newGame(3), 'p2', [R1], 3), 'p1', 10)
    let state = act(arrive(s, R1).state, { type: 'PAY_RENT' }).state
    state = act(arrive(state, 6).state, { type: 'END_TURN' }).state
    state = act(arrive(state, 6).state, { type: 'END_TURN' }).state
    expect(state.currentPlayerIndex).toBe(1)
  })
})
