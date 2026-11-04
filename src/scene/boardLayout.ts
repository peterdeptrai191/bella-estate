/**
 * Tính vị trí các ô và khung camera. Toán thuần (không import Three.js) để test được.
 *
 * Hệ trục: mặt bàn là mặt phẳng XZ, Y hướng lên. Nhìn từ camera mặc định (azimuth 45°):
 * Xuất Phát ở dưới, Đảo Hoang bên trái, Lễ Hội ở trên, Sân Bay bên phải.
 */
import { BOARD, TILES_PER_SIDE, type TileDef } from '../config/board'
import type { VisualConfig } from '../config/visual'

export interface TileTransform {
  def: TileDef
  /** Tâm ô trên mặt bàn [x, z]. */
  x: number
  z: number
  /** Xoay quanh trục Y để trục z cục bộ hướng ra ngoài bàn cờ. */
  rotationY: number
  /** Kích thước ô: dọc theo cạnh × chiều sâu. */
  width: number
  depth: number
  isCorner: boolean
}

/** Chiều dài một cạnh bàn cờ (không tính đế). */
export function boardLength(board: VisualConfig['board']): number {
  return 2 * board.cornerSize + (TILES_PER_SIDE - 1) * board.tileWidth
}

// Ô góc của mỗi cạnh nằm ở góc nào [x, z], cạnh đi theo hướng nào, mặt ngoài hướng nào.
const CORNER_SIGNS: Array<[number, number]> = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
]
const SIDE_DIRECTIONS: Array<[number, number]> = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
]
const SIDE_ROTATIONS = [0, -Math.PI / 2, Math.PI, Math.PI / 2]

export function computeTileLayout(board: VisualConfig['board']): TileTransform[] {
  const half = boardLength(board) / 2 - board.cornerSize / 2
  return BOARD.map((def) => {
    const [cx, cz] = CORNER_SIGNS[def.side]
    const isCorner = def.sideIndex === 0
    const along = isCorner ? 0 : board.cornerSize / 2 + (def.sideIndex - 0.5) * board.tileWidth
    const [dx, dz] = SIDE_DIRECTIONS[def.side]
    return {
      def,
      x: cx * half + dx * along,
      z: cz * half + dz * along,
      rotationY: SIDE_ROTATIONS[def.side],
      width: isCorner ? board.cornerSize : board.tileWidth,
      depth: board.cornerSize,
      isCorner,
    }
  })
}

/** Hướng nhìn của camera (đơn vị) và vị trí camera ở khoảng cách `distance` quanh gốc. */
export function cameraPosition(camera: Pick<VisualConfig['camera'], 'elevationDeg' | 'azimuthDeg'>, distance: number): [number, number, number] {
  const el = (camera.elevationDeg * Math.PI) / 180
  const az = (camera.azimuthDeg * Math.PI) / 180
  return [distance * Math.cos(el) * Math.sin(az), distance * Math.sin(el), distance * Math.cos(el) * Math.cos(az)]
}

/** Khung camera: zoom và độ lệch tâm theo trục "lên" của màn hình (đơn vị thế giới). */
export interface CameraFrame {
  zoom: number
  offsetUp: number
}

/**
 * Khung camera orthographic để bàn cờ vừa khung hình.
 * Chiếu 8 đỉnh khối bao lên mặt phẳng màn hình, lấy biên trên/dưới riêng (không đối xứng)
 * rồi dời tâm camera cho bàn cờ nằm giữa. Màn hình thấp (điện thoại xoay ngang) dùng lề nhỏ hơn
 * và chỉ chừa một phần chiều cao Landmark để bàn cờ to nhất có thể.
 */
export function fitFrame(visual: VisualConfig, viewportWidth: number, viewportHeight: number): CameraFrame {
  const { board, camera, buildings } = visual
  const half = boardLength(board) / 2 + board.baseMargin
  const top = board.tileHeight + (buildings.landmarkHeight + buildings.houseSize) * camera.fitHeadroom
  const bottom = -board.baseThickness

  const [px, py, pz] = cameraPosition(camera, 1)
  // Trục phải và trục lên của màn hình.
  const right = normalize([pz, 0, -px])
  const forward: Vec3 = [-px, -py, -pz]
  const up = cross(right, forward)

  let maxX = 0
  let minY = Infinity
  let maxY = -Infinity
  for (const x of [-half, half]) {
    for (const z of [-half, half]) {
      for (const y of [top, bottom]) {
        maxX = Math.max(maxX, Math.abs(dot([x, y, z], right)))
        const v = dot([x, y, z], up)
        minY = Math.min(minY, v)
        maxY = Math.max(maxY, v)
      }
    }
  }
  const pad = Math.min(viewportWidth, viewportHeight) < camera.compactHeight ? camera.fitPaddingCompact : camera.fitPadding
  const zoom = Math.min(viewportWidth / (2 * maxX * pad), viewportHeight / ((maxY - minY) * pad))
  return { zoom, offsetUp: (maxY + minY) / 2 }
}

/** Vector "lên" của màn hình trong toạ độ thế giới. */
export function screenUp(camera: VisualConfig['camera']): Vec3 {
  const [px, py, pz] = cameraPosition(camera, 1)
  const right = normalize([pz, 0, -px])
  return cross(right, [-px, -py, -pz])
}

type Vec3 = [number, number, number]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(...v) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

/** Đổi toạ độ cục bộ trong ô (x dọc cạnh, z hướng ra ngoài) sang toạ độ bàn cờ [x, z]. */
export function localToBoard(t: TileTransform, lx: number, lz: number): [number, number] {
  const c = Math.cos(t.rotationY)
  const s = Math.sin(t.rotationY)
  return [t.x + lx * c + lz * s, t.z - lx * s + lz * c]
}

/** Độ lệch các chỗ đứng khi `count` quân chung một ô (đơn vị: slotSpread). */
export function slotOffsets(count: number): Array<[number, number]> {
  switch (count) {
    case 0:
    case 1:
      return [[0, 0]]
    case 2:
      return [
        [-1, 0],
        [1, 0],
      ]
    case 3:
      return [
        [-1, -0.7],
        [1, -0.7],
        [0, 0.8],
      ]
    default:
      return [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]
  }
}

export interface PieceSpot {
  id: string
  position: number
  bankrupt: boolean
}

/**
 * Vị trí đứng [x, z] của từng quân. Quân chung một ô được xếp lệch theo thứ tự người chơi,
 * ô góc rộng hơn nên giãn rộng hơn.
 */
export function piecePlacement(
  pieces: PieceSpot[],
  layout: TileTransform[],
  cfg: VisualConfig['pieces'],
): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>()
  const byTile = new Map<number, string[]>()
  for (const p of pieces) {
    if (p.bankrupt) continue
    byTile.set(p.position, [...(byTile.get(p.position) ?? []), p.id])
  }
  for (const [tile, ids] of byTile) {
    const t = layout[tile]
    const spread = cfg.slotSpread * (t.isCorner ? 1.6 : 1)
    const anchorZ = -t.depth * (t.isCorner ? cfg.cornerInset : cfg.anchorInset)
    const offsets = slotOffsets(ids.length)
    ids.forEach((id, i) => {
      const [ox, oz] = offsets[i]
      result.set(id, localToBoard(t, ox * spread, anchorZ + oz * spread))
    })
  }
  return result
}

/** Mặt trên của ô (chỗ quân cờ đứng). */
export function tileTopY(board: VisualConfig['board']): number {
  return board.tileHeight + board.stripHeight
}

/** Mặt bãi cỏ ở giữa (chỗ xúc xắc nằm). */
export function centerTopY(board: VisualConfig['board']): number {
  return Math.max(0.02, board.tileHeight - board.centerDrop)
}

/** Vị trí nghỉ của hai viên xúc xắc: đặt cạnh nhau theo phương ngang màn hình. */
export function diceRestPositions(visual: VisualConfig): Array<[number, number, number]> {
  const az = (visual.camera.azimuthDeg * Math.PI) / 180
  const right: [number, number] = [Math.cos(az), -Math.sin(az)]
  const y = centerTopY(visual.board) + visual.dice.size / 2
  const h = visual.dice.spacing / 2
  return [
    [-right[0] * h, y, -right[1] * h],
    [right[0] * h, y, right[1] * h],
  ]
}
