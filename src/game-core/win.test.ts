import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../config/economy'
import { groupTiles, RESORT_INDICES, sidePurchasableTiles } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, own, patch, setMoney } from './testHelpers'

describe('5 điều kiện thắng (GDD mục 5)', () => {
  it('1. Người sống sót cuối cùng: các người khác phá sản', () => {
    const [R1] = groupTiles('red')
    const s = setMoney(own(newGame(2), 'p2', [R1], 3), 'p1', 10)
    const { state, events } = act(arrive(s, R1).state, { type: 'PAY_RENT' })
    expect(state.phase).toBe('finished')
    expect(state.winner).toBe('p2')
    expect(state.winReason).toBe('LAST_SURVIVOR')
    expect(eventsOf(events, 'GAME_OVER')[0]).toMatchObject({ winner: 'p2', reason: 'LAST_SURVIVOR' })
  })

  it('2. Độc quyền 3 nhóm màu: thắng ngay', () => {
    const pink = groupTiles('pink')
    const s = own(own(newGame(), 'p1', [...groupTiles('brown'), ...groupTiles('lightBlue')]), 'p1', pink.slice(0, 2))
    const before = arrive(s, pink[2]).state
    expect(before.phase).toBe('playing')
    const { state } = act(before, { type: 'BUY' })
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('THREE_COLOR_GROUPS')
  })

  it('2b. Hai nhóm màu thì chưa thắng', () => {
    const s = own(newGame(), 'p1', [...groupTiles('brown'), ...groupTiles('pink')])
    expect(act(arrive(s, groupTiles('orange')[0]).state, { type: 'BUY' }).state.phase).toBe('playing')
  })

  it('3. Độc quyền một cạnh bàn cờ (mọi ô mua được trên cạnh): thắng ngay', () => {
    const side = sidePurchasableTiles(3)
    const last = side[side.length - 2]
    const s = own(newGame(), 'p1', side.filter((i) => i !== last))
    const { state } = act(arrive(s, last).state, { type: 'BUY' })
    expect(state.winReason).toBe('SIDE_MONOPOLY')
    expect(state.winner).toBe('p1')
  })

  it('3b. Mua lại ô cuối cùng của cạnh cũng thắng', () => {
    const side = sidePurchasableTiles(1)
    const last = side[1]
    const s = own(own(newGame(), 'p1', side.filter((i) => i !== last)), 'p2', [last])
    const paid = act(arrive(s, last).state, { type: 'PAY_RENT' }).state
    expect(act(paid, { type: 'BUYOUT' }).state.winReason).toBe('SIDE_MONOPOLY')
  })

  it('4. Độc quyền 4 Khu Du Lịch: thắng ngay', () => {
    const s = own(newGame(), 'p1', RESORT_INDICES.slice(0, 3))
    const { state } = act(arrive(s, RESORT_INDICES[3]).state, { type: 'BUY' })
    expect(state.winReason).toBe('ALL_RESORTS')
  })

  it('5. Hết giới hạn 30 vòng: người có tổng tài sản cao nhất thắng', () => {
    const s = patch(own(newGame(3), 'p3', [groupTiles('darkBlue')[0]], 2), (x) => {
      x.round = ECONOMY.maxRounds
      x.currentPlayerIndex = 2
      x.turn.step = 'ACT'
    })
    const { state, events } = act(s, { type: 'END_TURN' })
    expect(state.phase).toBe('finished')
    expect(state.winReason).toBe('ROUND_LIMIT')
    expect(state.winner).toBe('p3')
    const over = eventsOf(events, 'GAME_OVER')[0]
    expect(over.standings.map((x) => x.playerId)).toEqual(['p3', 'p1', 'p2'])
  })

  it('chưa hết vòng 30 thì chưa kết thúc', () => {
    const s = patch(newGame(2), (x) => {
      x.round = ECONOMY.maxRounds - 1
      x.currentPlayerIndex = 1
      x.turn.step = 'ACT'
    })
    const { state } = act(s, { type: 'END_TURN' })
    expect(state.phase).toBe('playing')
    expect(state.round).toBe(ECONOMY.maxRounds)
  })

  it('ván đã kết thúc thì mọi action đều bị từ chối', () => {
    const s = own(newGame(), 'p1', RESORT_INDICES.slice(0, 3))
    const { state } = act(arrive(s, RESORT_INDICES[3]).state, { type: 'BUY' })
    expect(() => act(state, { type: 'END_TURN' })).toThrow(GameRuleError)
  })
})
