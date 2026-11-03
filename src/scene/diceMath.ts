/**
 * Hướng xoay để mặt `value` của xúc xắc ngửa lên. Quy ước mặt (tổng mặt đối = 7):
 * +Y = 1, -Y = 6, +X = 2, -X = 5, +Z = 3, -Z = 4.
 * Chỉ dùng xoay quanh X hoặc Z, nên cộng thêm bội số 2π (để xoay nhiều vòng) không đổi kết quả.
 */
export function faceRotation(value: number): { x: number; z: number } {
  switch (value) {
    case 1:
      return { x: 0, z: 0 }
    case 6:
      return { x: Math.PI, z: 0 }
    case 2:
      return { x: 0, z: Math.PI / 2 }
    case 5:
      return { x: 0, z: -Math.PI / 2 }
    case 3:
      return { x: -Math.PI / 2, z: 0 }
    case 4:
      return { x: Math.PI / 2, z: 0 }
    default:
      throw new Error(`Mặt xúc xắc không hợp lệ: ${value}`)
  }
}

/** Pháp tuyến và hai trục trên mặt của từng mặt xúc xắc (toạ độ cục bộ). */
export const FACES: Array<{ value: number; normal: [number, number, number]; u: [number, number, number]; v: [number, number, number] }> = [
  { value: 1, normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 6, normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 2, normal: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { value: 5, normal: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { value: 3, normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 4, normal: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
]

/** Vị trí các chấm trên mặt, theo lưới 3×3 (-1, 0, 1). */
export function pipLayout(value: number): Array<[number, number]> {
  const c: [number, number] = [0, 0]
  const tl: [number, number] = [-1, -1]
  const br: [number, number] = [1, 1]
  const tr: [number, number] = [1, -1]
  const bl: [number, number] = [-1, 1]
  switch (value) {
    case 1:
      return [c]
    case 2:
      return [tl, br]
    case 3:
      return [tl, c, br]
    case 4:
      return [tl, tr, bl, br]
    case 5:
      return [tl, tr, bl, br, c]
    default:
      return [tl, [-1, 0], bl, tr, [1, 0], br]
  }
}
