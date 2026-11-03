import { describe, expect, it } from 'vitest'
import { groupTiles, RESORT_INDICES } from './board'
import { newGame, own, patch } from './testHelpers'
import { buyoutPrice, housesOwned, investedValue, netWorth, rentFor, sellValue } from './valuation'

const [B1, B2, B3] = groupTiles('brown') // P = 60

describe('Tiền thuê thành phố (GDD mục 4)', () => {
  it('theo cấp: 0,2P / 0,6P / 1,2P / 2P / 3P', () => {
    const rents = [0, 1, 2, 3, 4].map((level) => rentFor(own(newGame(), 'p2', [B3], level), B3))
    expect(rents).toEqual([12, 36, 72, 120, 180])
  })

  it('sở hữu trọn nhóm màu: x2', () => {
    const s = own(newGame(), 'p2', [B1, B2, B3], 1)
    expect(rentFor(s, B3)).toBe(72)
  })

  it('đang tổ chức Lễ Hội: x2, cộng dồn với độc quyền nhóm', () => {
    const single = patch(own(newGame(), 'p2', [B3], 1), (s) => (s.festivalTile = B3))
    expect(rentFor(single, B3)).toBe(72)
    const both = patch(own(newGame(), 'p2', [B1, B2, B3], 1), (s) => (s.festivalTile = B3))
    expect(rentFor(both, B3)).toBe(144)
  })
})

describe('Khu Du Lịch', () => {
  it('tiền thuê 50 / 100 / 200 / 400 theo số khu sở hữu', () => {
    const rents = [1, 2, 3, 4].map((n) => rentFor(own(newGame(), 'p2', RESORT_INDICES.slice(0, n)), RESORT_INDICES[0]))
    expect(rents).toEqual([50, 100, 200, 400])
  })
})

describe('Giá trị tài sản', () => {
  it('giá trị đầu tư = đất + nhà (0,5P mỗi nhà) + Landmark (1P)', () => {
    expect(investedValue(own(newGame(), 'p1', [B3], 0), B3)).toBe(60)
    expect(investedValue(own(newGame(), 'p1', [B3], 3), B3)).toBe(150)
    expect(investedValue(own(newGame(), 'p1', [B3], 4), B3)).toBe(210)
    expect(investedValue(own(newGame(), 'p1', [RESORT_INDICES[0]]), RESORT_INDICES[0])).toBe(200)
  })

  it('mua lại = 2x giá trị đầu tư; bán ngân hàng = 50%', () => {
    const s = own(newGame(), 'p1', [B3], 2)
    expect(buyoutPrice(s, B3)).toBe(240)
    expect(sellValue(s, B3)).toBe(60)
  })

  it('tổng tài sản = tiền mặt + giá trị đầu tư; Landmark tính như 3 nhà khi đếm nhà', () => {
    const s = own(own(newGame(), 'p1', [B3], 4), 'p1', [B1], 2)
    expect(netWorth(s, 'p1')).toBe(1500 + 210 + 120)
    expect(housesOwned(s, 'p1')).toBe(5)
  })
})
