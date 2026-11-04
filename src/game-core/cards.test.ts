import { describe, expect, it } from 'vitest'
import type { CardId } from '../config/cards'
import { FESTIVAL_INDEX, groupTiles, ISLAND_INDEX } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, own, patch, player, withCard } from './testHelpers'
import type { GameState } from './types'

const CHANCE = 3
const [, , B3] = groupTiles('brown')
const [P1] = groupTiles('pink')

/** Người chơi 1 dừng ở ô Cơ Hội và rút đúng thẻ `card`. */
function draw(state: GameState, card: CardId) {
  const landed = arrive(state, CHANCE).state
  expect(landed.turn.pending?.type).toBe('DRAW_CARD')
  return act(withCard(landed, card), { type: 'DRAW_CARD' })
}

describe('Ô Cơ Hội', () => {
  it('bắt buộc rút thẻ trước khi kết thúc lượt', () => {
    const landed = arrive(newGame(), CHANCE).state
    expect(() => act(landed, { type: 'END_TURN' })).toThrow(GameRuleError)
    const { events } = act(landed, { type: 'DRAW_CARD' })
    expect(eventsOf(events, 'CARD_DRAWN')).toHaveLength(1)
  })
})

describe('10 thẻ Cơ Hội (GDD mục 6)', () => {
  it('Ra Đảo: giữ lại để dùng sau', () => {
    const { state } = draw(newGame(), 'ESCAPE_ISLAND')
    expect(player(state, 'p1').heldCards).toEqual(['ESCAPE_ISLAND'])
  })

  it('Giảm Giá: lần trả tiền thuê tiếp theo giảm 50%', () => {
    const { state } = draw(newGame(), 'DISCOUNT')
    expect(player(state, 'p1').rentDiscount).toBe(true)

    const s = patch(own(newGame(), 'p2', [B3], 1), (x) => (x.players[0].rentDiscount = true))
    const { state: paid, events } = act(arrive(s, B3).state, { type: 'PAY_RENT' })
    expect(player(paid, 'p1').money).toBe(1500 - 18)
    expect(player(paid, 'p1').rentDiscount).toBe(false)
    expect(eventsOf(events, 'RENT_PAID')[0]).toMatchObject({ amount: 18, discounted: true })
  })

  it('Lá Chắn: giữ lại, dùng để miễn trả tiền thuê một lần (vẫn được mua lại sau đó)', () => {
    expect(player(draw(newGame(), 'SHIELD').state, 'p1').heldCards).toEqual(['SHIELD'])

    const s = patch(own(newGame(), 'p2', [B3], 1), (x) => (x.players[0].heldCards = ['SHIELD']))
    const { state, events } = act(arrive(s, B3).state, { type: 'USE_CARD', card: 'SHIELD' })
    expect(player(state, 'p1').money).toBe(1500)
    expect(player(state, 'p1').heldCards).toEqual([])
    expect(eventsOf(events, 'RENT_WAIVED')[0].amount).toBe(36)
    expect(act(state, { type: 'BUYOUT' }).state.tiles[B3].owner).toBe('p1')
  })

  it('Về Xuất Phát: tới ô Xuất Phát, nhận +200 và được nhà miễn phí', () => {
    const { state, events } = draw(own(newGame(), 'p1', [B3]), 'GO_TO_START')
    expect(player(state, 'p1').position).toBe(0)
    expect(player(state, 'p1').money).toBe(1700)
    expect(state.turn.freeHouse).toBe(true)
    expect(eventsOf(events, 'PASSED_START')).toHaveLength(1)
  })

  it('Đi Lễ Hội: tới ô Lễ Hội và được tổ chức', () => {
    const { state } = draw(own(newGame(), 'p1', [B3]), 'GO_TO_FESTIVAL')
    expect(player(state, 'p1').position).toBe(FESTIVAL_INDEX)
    expect(act(state, { type: 'HOST_FESTIVAL', tileIndex: B3 }).state.festivalTile).toBe(B3)
  })

  it('Động Đất: phá 1 nhà của đối thủ tùy chọn, không áp dụng với Landmark', () => {
    const s = own(own(newGame(), 'p2', [P1], 2), 'p2', [B3], 4)
    const { state } = draw(s, 'EARTHQUAKE')
    expect(state.turn.pending?.type).toBe('EARTHQUAKE')
    expect(() => act(state, { type: 'END_TURN' })).toThrow(GameRuleError)
    expect(() => act(state, { type: 'EARTHQUAKE', tileIndex: B3 })).toThrow(GameRuleError)
    const { state: next, events } = act(state, { type: 'EARTHQUAKE', tileIndex: P1 })
    expect(next.tiles[P1].level).toBe(1)
    expect(eventsOf(events, 'HOUSE_DESTROYED')[0]).toMatchObject({ owner: 'p2', tileIndex: P1, level: 1 })
  })

  it('Động Đất: không có nhà nào để phá thì không có hiệu ứng, có event báo cho người chơi', () => {
    const { state, events } = draw(own(newGame(), 'p2', [B3], 0), 'EARTHQUAKE')
    expect(state.turn.pending).toBeNull()
    expect(eventsOf(events, 'EARTHQUAKE_NO_TARGET')).toHaveLength(1)
  })

  it('Động Đất: phải phá ngay trong lượt — chưa chọn nhà thì không kết thúc lượt được', () => {
    const s = own(newGame(), 'p2', [P1], 2)
    const { state } = draw(s, 'EARTHQUAKE')
    expect(() => act(state, { type: 'END_TURN' })).toThrow(GameRuleError)
    const { state: next } = act(state, { type: 'EARTHQUAKE', tileIndex: P1 })
    expect(next.turn.pending).toBeNull()
    expect(next.tiles[P1].level).toBe(1)
  })

  it('Ra Đảo Ngay: bị đưa ra Đảo Hoang', () => {
    const { state, events } = draw(newGame(), 'GO_TO_ISLAND')
    expect(player(state, 'p1').position).toBe(ISLAND_INDEX)
    expect(player(state, 'p1').islandTurnsLeft).toBe(3)
    expect(eventsOf(events, 'SENT_TO_ISLAND')[0].reason).toBe('CARD')
  })

  it('Thuế Bất Ngờ: nộp 100 cho mỗi căn nhà (Landmark tính 3 nhà)', () => {
    const s = own(own(newGame(), 'p1', [B3], 2), 'p1', [P1], 4)
    const { state } = draw(s, 'SURPRISE_TAX')
    expect(player(state, 'p1').money).toBe(1500 - 500)
  })

  it('Từ Thiện: trả 50 cho mỗi người chơi khác', () => {
    const { state } = draw(newGame(4), 'CHARITY')
    expect(state.players.map((p) => p.money)).toEqual([1350, 1550, 1550, 1550])
  })

  it('Trúng Xổ Số: nhận 200', () => {
    const { state, events } = draw(newGame(), 'LOTTERY')
    expect(player(state, 'p1').money).toBe(1700)
    expect(eventsOf(events, 'MONEY_RECEIVED')[0].amount).toBe(200)
  })
})
