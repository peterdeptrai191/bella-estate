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
export function cameraPosition(camera: VisualConfig['camera'], distance: number): [number, number, number] {
  const el = (camera.elevationDeg * Math.PI) / 180
  const az = (camera.azimuthDeg * Math.PI) / 180
  return [distance * Math.cos(el) * Math.sin(az), distance * Math.sin(el), distance * Math.cos(el) * Math.cos(az)]
}

/**
 * Zoom của camera orthographic để cả bàn cờ (tính cả đế và nhà cao nhất) vừa khung hình.
 * Chiếu 8 đỉnh khối bao lên mặt phẳng màn hình rồi so với kích thước khung (pixel).
 */
export function fitZoom(visual: VisualConfig, viewportWidth: number, viewportHeight: number): number {
  const { board, camera, buildings } = visual
  const half = boardLength(board) / 2 + board.baseMargin
  const top = board.tileHeight + buildings.landmarkHeight + buildings.houseSize
  const bottom = -board.baseThickness

  const [px, py, pz] = cameraPosition(camera, 1)
  // Trục phải và trục lên của màn hình.
  const right = normalize([pz, 0, -px])
  const forward: [number, number, number] = [-px, -py, -pz]
  const up = cross(right, forward)

  let maxX = 0
  let maxY = 0
  for (const x of [-half, half]) {
    for (const z of [-half, half]) {
      for (const y of [top, bottom]) {
        maxX = Math.max(maxX, Math.abs(dot([x, y, z], right)))
        maxY = Math.max(maxY, Math.abs(dot([x, y, z], up)))
      }
    }
  }
  const pad = camera.fitPadding
  return Math.min(viewportWidth / (2 * maxX * pad), viewportHeight / (2 * maxY * pad))
}

type Vec3 = [number, number, number]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(...v) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}
