import { describe, expect, it } from 'vitest'
import { BOARD, BOARD_SIZE, COLOR_GROUPS } from './board'
import { ECONOMY } from './economy'

const count = (kind: string) => BOARD.filter((t) => t.kind === kind).length

describe('Bàn cờ (GDD mục 3)', () => {
  it('có 32 ô, đánh số liên tục', () => {
    expect(BOARD).toHaveLength(BOARD_SIZE)
    BOARD.forEach((t, i) => expect(t.index).toBe(i))
  })

  it('4 ô góc ở đầu mỗi cạnh: Xuất Phát, Đảo Hoang, Lễ Hội, Sân Bay', () => {
    expect([0, 8, 16, 24].map((i) => BOARD[i].kind)).toEqual(['START', 'ISLAND', 'FESTIVAL', 'AIRPORT'])
    expect([0, 8, 16, 24].every((i) => BOARD[i].sideIndex === 0)).toBe(true)
  })

  it('28 ô còn lại: 20 thành phố, 4 Khu Du Lịch, 3 Cơ Hội, 1 Thuế', () => {
    expect(count('CITY')).toBe(20)
    expect(count('RESORT')).toBe(4)
    expect(count('CHANCE')).toBe(3)
    expect(count('TAX')).toBe(1)
  })

  it('7 nhóm màu: 6 nhóm 3 ô và 1 nhóm cao cấp 2 ô, giá đúng GDD', () => {
    const expected = { brown: 60, lightBlue: 100, pink: 140, orange: 180, red: 220, yellow: 260, darkBlue: 320 }
    expect(COLOR_GROUPS).toHaveLength(7)
    for (const g of COLOR_GROUPS) {
      const tiles = BOARD.filter((t) => t.group === g.id)
      expect(tiles).toHaveLength(g.premium ? 2 : 3)
      expect(tiles.every((t) => t.price === expected[g.id])).toBe(true)
    }
  })

  it('mỗi cạnh: 1 góc + 7 ô, gồm 5 thành phố và 1 Khu Du Lịch', () => {
    for (const side of [0, 1, 2, 3]) {
      const tiles = BOARD.filter((t) => t.side === side)
      expect(tiles).toHaveLength(8)
      expect(tiles.filter((t) => t.kind === 'CITY')).toHaveLength(5)
      expect(tiles.filter((t) => t.kind === 'RESORT')).toHaveLength(1)
    }
  })

  it('Khu Du Lịch giá 200; mỗi thành phố có tên thật, Landmark và mô tả (chủ đề Vòng quanh thế giới)', () => {
    expect(BOARD.filter((t) => t.kind === 'RESORT').map((t) => t.name)).toEqual(['Vịnh Hạ Long', 'Maldives', 'Santorini', 'Hawaii'])
    expect(BOARD.filter((t) => t.kind === 'RESORT').every((t) => t.price === ECONOMY.resort.price)).toBe(true)
    const cities = BOARD.filter((t) => t.kind === 'CITY')
    expect(cities.map((t) => t.name)).toEqual([
      'Cairo', 'Nairobi', 'Cape Town', 'Jakarta', 'Bangkok', 'Hà Nội', 'Lima', 'Buenos Aires', 'Rio de Janeiro', 'Doha',
      'Istanbul', 'Dubai', 'Thượng Hải', 'Seoul', 'Tokyo', 'Rome', 'Berlin', 'Paris', 'London', 'New York',
    ])
    expect(cities.every((t) => t.landmark && t.description)).toBe(true)
    expect(new Set(BOARD.map((t) => t.name)).size).toBe(BOARD_SIZE - 2) // 3 ô Cơ Hội trùng tên
  })

  it('giá thành phố tăng dần theo chiều đi', () => {
    const prices = BOARD.filter((t) => t.kind === 'CITY').map((t) => t.price ?? 0)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })
})
