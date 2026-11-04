import { describe, expect, it } from 'vitest'
import { VISUAL } from '../config/visual'
import { boardLength, computeTileLayout, fitFrame, piecePlacement } from './boardLayout'

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
    const desktop = fitFrame(VISUAL, 1280, 800).zoom
    const portrait = fitFrame(VISUAL, 390, 844).zoom
    expect(desktop).toBeGreaterThan(0)
    expect(portrait).toBeLessThan(desktop)
  })

  it('điện thoại xoay ngang (màn thấp) dùng lề nhỏ hơn nên bàn cờ to hơn', () => {
    const phone = fitFrame(VISUAL, 800, 300).zoom
    const roomy = fitFrame({ ...VISUAL, camera: { ...VISUAL.camera, compactHeight: 0 } }, 800, 300).zoom
    expect(phone).toBeGreaterThan(roomy)
  })
})

describe('Quân cờ chung ô', () => {
  it('không chồng lên nhau, ô góc giãn rộng hơn', () => {
    const spots = (tile: number) => ['p1', 'p2', 'p3', 'p4'].map((id) => ({ id, position: tile, bankrupt: false }))
    for (const tile of [0, 5]) {
      const placed = [...piecePlacement(spots(tile), layout, VISUAL.pieces).values()]
      expect(placed).toHaveLength(4)
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const d = Math.hypot(placed[i][0] - placed[j][0], placed[i][1] - placed[j][1])
          expect(d).toBeGreaterThan(VISUAL.pieces.slotSpread * 1.5)
        }
      }
    }
  })

  it('quân phá sản không có chỗ đứng; quân đứng một mình ở giữa phần trong của ô', () => {
    const placed = piecePlacement(
      [
        { id: 'p1', position: 5, bankrupt: false },
        { id: 'p2', position: 5, bankrupt: true },
      ],
      layout,
      VISUAL.pieces,
    )
    expect(placed.has('p2')).toBe(false)
    const [x, z] = placed.get('p1') ?? [0, 0]
    const t = layout[5]
    expect(Math.hypot(x - t.x, z - t.z)).toBeCloseTo(t.depth * VISUAL.pieces.anchorInset)
  })
})
