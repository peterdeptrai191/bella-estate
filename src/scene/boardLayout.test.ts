import { describe, expect, it } from 'vitest'
import { VISUAL } from '../config/visual'
import { boardLength, computeTileLayout, fitZoom } from './boardLayout'

const layout = computeTileLayout(VISUAL.board)

describe('Bố cục bàn cờ 3D', () => {
  it('32 ô, 4 ô góc to hơn ô thường', () => {
    expect(layout).toHaveLength(32)
    const corners = layout.filter((t) => t.isCorner)
    expect(corners.map((t) => t.def.index)).toEqual([0, 8, 16, 24])
    expect(corners.every((t) => t.width === VISUAL.board.cornerSize)).toBe(true)
    expect(VISUAL.board.cornerSize).toBeGreaterThan(VISUAL.board.tileWidth)
  })

  it('Xuất Phát ở góc gần camera (+x, +z), các ô nằm trên viền và không chồng nhau', () => {
    const start = layout[0]
    expect(start.x).toBeGreaterThan(0)
    expect(start.z).toBeGreaterThan(0)
    const edge = boardLength(VISUAL.board) / 2 - VISUAL.board.cornerSize / 2
    for (const t of layout) {
      expect(Math.max(Math.abs(t.x), Math.abs(t.z))).toBeCloseTo(edge)
    }
    for (let i = 0; i < layout.length; i++) {
      const a = layout[i]
      const b = layout[(i + 1) % layout.length]
      const dist = Math.hypot(a.x - b.x, a.z - b.z)
      expect(dist).toBeCloseTo((a.width + b.width) / 2)
    }
  })

  it('khung màn hình dọc cho zoom nhỏ hơn màn hình ngang', () => {
    const desktop = fitZoom(VISUAL, 1280, 800)
    const portrait = fitZoom(VISUAL, 390, 844)
    expect(desktop).toBeGreaterThan(0)
    expect(portrait).toBeLessThan(desktop)
  })
})
