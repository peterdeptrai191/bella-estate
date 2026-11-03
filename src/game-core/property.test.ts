import { describe, expect, it } from 'vitest'
import { AIRPORT_INDEX, FESTIVAL_INDEX, groupTiles, RESORT_INDICES } from './board'
import { GameRuleError } from './context'
import { act, arrive, eventsOf, newGame, own, patch, player, run, setMoney } from './testHelpers'
import { rentFor } from './valuation'

const [, , B3] = groupTiles('brown') // ô 4, P = 60
const [, , P3] = groupTiles('pink') // ô 13, P = 140
const TAX = 29
const CHANCE = 3

describe('Mua đất', () => {
  it('dừng ở ô trống thì mua được với giá P', () => {
    const { state } = arrive(newGame(), B3)
    const { state: next, events } = act(state, { type: 'BUY' })
    expect(next.tiles[B3]).toEqual({ owner: 'p1', level: 0 })
    expect(player(next, 'p1').money).toBe(1440)
    expect(eventsOf(events, 'PROPERTY_BOUGHT')[0]).toMatchObject({ tileIndex: B3, price: 60 })
  })

  it('không mua được ô đã có chủ, ô không mua được, hoặc khi thiếu tiền', () => {
    expect(() => act(arrive(own(newGame(), 'p1', [B3]), B3).state, { type: 'BUY' })).toThrow(GameRuleError)
    expect(() => act(arrive(newGame(), TAX).state, { type: 'BUY' })).toThrow(GameRuleError)
    expect(() => act(arrive(newGame(), CHANCE).state, { type: 'BUY' })).toThrow(GameRuleError)
    expect(() => act(arrive(setMoney(newGame(), 'p1', 50), B3).state, { type: 'BUY' })).toThrow(GameRuleError)
  })

  it('Khu Du Lịch mua giá 200, không xây nhà được', () => {
    const { state } = run(arrive(newGame(), RESORT_INDICES[0]).state, { type: 'BUY' })
    expect(player(state, 'p1').money).toBe(1300)
    expect(() => act(state, { type: 'BUILD', tileIndex: RESORT_INDICES[0] })).toThrow(GameRuleError)
  })
})

describe('Xây nhà và Landmark', () => {
  it('mua xong được xây ngay tới 3 nhà, mỗi nhà 0,5P', () => {
    const { state } = run(
      arrive(newGame(), B3).state,
      { type: 'BUY' },
      { type: 'BUILD', tileIndex: B3 },
      { type: 'BUILD', tileIndex: B3 },
      { type: 'BUILD', tileIndex: B3 },
    )
    expect(state.tiles[B3].level).toBe(3)
    expect(player(state, 'p1').money).toBe(1500 - 60 - 30 * 3)
  })

  it('Landmark cần đủ 3 nhà và không xây được trong lần dừng vừa mua ô', () => {
    const bought = run(
      arrive(newGame(), B3).state,
      { type: 'BUY' },
      { type: 'BUILD', tileIndex: B3 },
      { type: 'BUILD', tileIndex: B3 },
      { type: 'BUILD', tileIndex: B3 },
    ).state
    expect(() => act(bought, { type: 'BUILD', tileIndex: B3 })).toThrow(/Landmark/)
  })

  it('lần dừng sau trên đất của mình: xây Landmark giá 1P', () => {
    const { state } = arrive(own(newGame(), 'p1', [B3], 3), B3)
    const { state: next, events } = act(state, { type: 'BUILD', tileIndex: B3 })
    expect(next.tiles[B3].level).toBe(4)
    expect(player(next, 'p1').money).toBe(1440)
    expect(eventsOf(events, 'BUILT')[0]).toMatchObject({ level: 4, cost: 60 })
    expect(() => act(next, { type: 'BUILD', tileIndex: B3 })).toThrow(GameRuleError)
  })

  it('chỉ xây trên ô đang đứng và là của mình', () => {
    const s = own(own(newGame(), 'p1', [P3]), 'p2', [B3])
    // Đứng trên đất đối thủ (đã trả thuê): không xây được.
    const onOpponent = act(arrive(s, B3).state, { type: 'PAY_RENT' }).state
    expect(() => act(onOpponent, { type: 'BUILD', tileIndex: B3 })).toThrow(GameRuleError)
    // Đứng trên đất mình: không xây hộ ô của đối thủ.
    const atOwn = arrive(s, P3).state
    expect(() => act(atOwn, { type: 'BUILD', tileIndex: B3 })).toThrow(GameRuleError)
    // Đứng ô khác: không xây từ xa lên đất mình.
    expect(() => act(arrive(own(newGame(), 'p1', [P3]), B3 + 1).state, { type: 'BUILD', tileIndex: P3 })).toThrow(
      GameRuleError,
    )
  })
})

describe('Tiền thuê và mua lại', () => {
  const rented = () => arrive(own(newGame(), 'p2', [B3], 1), B3)

  it('dừng trên đất đối thủ: bắt buộc trả tiền thuê trước khi kết thúc lượt', () => {
    const { state, events } = rented()
    expect(eventsOf(events, 'RENT_DUE')[0]).toMatchObject({ from: 'p1', to: 'p2', amount: 36 })
    expect(() => act(state, { type: 'END_TURN' })).toThrow(GameRuleError)
    const paid = act(state, { type: 'PAY_RENT' })
    expect(player(paid.state, 'p1').money).toBe(1464)
    expect(player(paid.state, 'p2').money).toBe(1536)
    expect(eventsOf(paid.events, 'RENT_PAID')[0]).toMatchObject({ from: 'p1', to: 'p2', tileIndex: B3, amount: 36 })
  })

  it('sau khi trả tiền thuê được mua lại với giá 2x giá trị đầu tư, chủ cũ nhận hết', () => {
    const paid = act(rented().state, { type: 'PAY_RENT' }).state
    const { state, events } = act(paid, { type: 'BUYOUT' })
    expect(state.tiles[B3]).toEqual({ owner: 'p1', level: 1 })
    expect(eventsOf(events, 'BOUGHT_OUT')[0]).toMatchObject({ price: 180, from: 'p2' })
    expect(player(state, 'p1').money).toBe(1500 - 36 - 180)
    expect(player(state, 'p2').money).toBe(1500 + 36 + 180)
    // Mua lại xong được xây thêm nhà ngay.
    expect(act(state, { type: 'BUILD', tileIndex: B3 }).state.tiles[B3].level).toBe(2)
  })

  it('chưa trả tiền thuê thì chưa được mua lại', () => {
    expect(() => act(rented().state, { type: 'BUYOUT' })).toThrow(GameRuleError)
  })

  it('Landmark không thể bị mua lại', () => {
    const { state } = arrive(own(newGame(), 'p2', [B3], 4), B3)
    const paid = act(state, { type: 'PAY_RENT' }).state
    expect(() => act(paid, { type: 'BUYOUT' })).toThrow(/Landmark|mua lại/)
  })

  it('thiếu tiền thì không mua lại được', () => {
    const { state } = arrive(setMoney(own(newGame(), 'p2', [B3], 1), 'p1', 100), B3)
    const paid = act(state, { type: 'PAY_RENT' }).state
    expect(() => act(paid, { type: 'BUYOUT' })).toThrow(GameRuleError)
  })

  it('Khu Du Lịch: tiền thuê theo số khu chủ sở hữu có, mua lại được', () => {
    const s = own(newGame(), 'p2', RESORT_INDICES.slice(0, 2))
    const { events, state } = arrive(s, RESORT_INDICES[0])
    expect(eventsOf(events, 'RENT_DUE')[0].amount).toBe(100)
    const bought = run(state, { type: 'PAY_RENT' }, { type: 'BUYOUT' }).state
    expect(bought.tiles[RESORT_INDICES[0]].owner).toBe('p1')
    expect(player(bought, 'p1').money).toBe(1500 - 100 - 400)
  })
})

describe('Lễ Hội', () => {
  it('dừng ở Lễ Hội: chọn thành phố của mình, tiền thuê x2', () => {
    const s = own(newGame(), 'p1', [B3], 1)
    const { state } = arrive(s, FESTIVAL_INDEX)
    const { state: next, events } = act(state, { type: 'HOST_FESTIVAL', tileIndex: B3 })
    expect(next.festivalTile).toBe(B3)
    expect(rentFor(next, B3)).toBe(72)
    expect(eventsOf(events, 'FESTIVAL_HOSTED')[0]).toMatchObject({ tileIndex: B3, previousTile: null })
  })

  it('Lễ Hội chuyển chỗ khi có người tổ chức ở nơi khác', () => {
    const s = patch(own(own(newGame(), 'p1', [B3], 1), 'p2', [P3]), (x) => {
      x.festivalTile = B3
      x.currentPlayerIndex = 1
    })
    const { state } = arrive(s, FESTIVAL_INDEX)
    const next = act(state, { type: 'HOST_FESTIVAL', tileIndex: P3 }).state
    expect(next.festivalTile).toBe(P3)
    expect(rentFor(next, B3)).toBe(36)
  })

  it('không tổ chức được ở thành phố của người khác hoặc khi không đứng ở Lễ Hội', () => {
    const s = own(own(newGame(), 'p1', [B3]), 'p2', [P3])
    const { state } = arrive(s, FESTIVAL_INDEX)
    expect(() => act(state, { type: 'HOST_FESTIVAL', tileIndex: P3 })).toThrow(GameRuleError)
    expect(() => act(arrive(s, 6).state, { type: 'HOST_FESTIVAL', tileIndex: B3 })).toThrow(GameRuleError)
  })
})

describe('Sân Bay', () => {
  const ticketHolder = () =>
    patch(newGame(), (s) => {
      s.players[0].position = AIRPORT_INDEX
      s.players[0].airportTicket = true
    })

  it('dừng ở Sân Bay thì lượt sau được bay; dừng bằng đôi cũng mất lượt tung thêm', () => {
    const { state, events } = arrive(newGame(), AIRPORT_INDEX, [2, 2])
    expect(player(state, 'p1').airportTicket).toBe(true)
    expect(eventsOf(events, 'AIRPORT_TICKET')).toHaveLength(1)
    expect(act(state, { type: 'END_TURN' }).state.currentPlayerIndex).toBe(1)
  })

  it('bay tới ô bất kỳ tốn 100, xử lý ô tới như bình thường', () => {
    const s = own(ticketHolder(), 'p2', [30], 1)
    const { state, events } = act(s, { type: 'FLY', tileIndex: 30 })
    expect(player(state, 'p1').position).toBe(30)
    expect(player(state, 'p1').money).toBe(1400)
    expect(player(state, 'p1').airportTicket).toBe(false)
    expect(eventsOf(events, 'PLAYER_MOVED')[0].mode).toBe('FLY')
    expect(state.turn.pending?.type).toBe('RENT')
  })

  it('bay qua Xuất Phát vẫn nhận +200', () => {
    const { state } = act(ticketHolder(), { type: 'FLY', tileIndex: 6 })
    expect(player(state, 'p1').money).toBe(1500 - 100 + 200)
  })

  it('không bay tới chính Sân Bay; tung xúc xắc thay vì bay thì mất vé', () => {
    expect(() => act(ticketHolder(), { type: 'FLY', tileIndex: AIRPORT_INDEX })).toThrow(GameRuleError)
    const rolled = act(ticketHolder(), { type: 'ROLL_DICE' }).state
    expect(player(rolled, 'p1').airportTicket).toBe(false)
    expect(() => act(newGame(), { type: 'FLY', tileIndex: 6 })).toThrow(GameRuleError)
  })
})

describe('Ô Thuế', () => {
  it('nộp 10% tổng tài sản cho ngân hàng', () => {
    const s = own(newGame(), 'p1', [B3], 1) // tổng tài sản = 1500 + 90
    const { state, events } = arrive(s, TAX)
    expect(player(state, 'p1').money).toBe(1500 - 159)
    expect(eventsOf(events, 'MONEY_PAID')[0]).toMatchObject({ amount: 159, to: null, reason: 'TAX' })
  })
})
