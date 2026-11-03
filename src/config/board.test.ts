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

  it('Khu Du Lịch giá 200, thành phố đặt tên tạm "Thành phố 1..20"', () => {
    expect(BOARD.filter((t) => t.kind === 'RESORT').every((t) => t.price === ECONOMY.resort.price)).toBe(true)
    expect(BOARD.filter((t) => t.kind === 'CITY').map((t) => t.name)).toEqual(
      Array.from({ length: 20 }, (_, i) => `Thành phố ${i + 1}`),
    )
  })
})
