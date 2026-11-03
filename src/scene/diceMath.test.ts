import { Euler, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { FACES, faceRotation, pipLayout } from './diceMath'

/** Mặt nào đang ngửa lên sau khi xoay inner (x, z) rồi xoay outer quanh Y. */
function topFace(x: number, z: number, yaw: number): number {
  let best = { value: 0, up: -Infinity }
  for (const face of FACES) {
    const n = new Vector3(...face.normal).applyEuler(new Euler(x, 0, z)).applyEuler(new Euler(0, yaw, 0))
    if (n.y > best.up) best = { value: face.value, up: n.y }
  }
  return best.value
}

describe('Xúc xắc dừng đúng mặt', () => {
  it.each([1, 2, 3, 4, 5, 6])('mặt %i ngửa lên, kể cả khi xoay thêm nhiều vòng và xoay ngang', (value) => {
    const r = faceRotation(value)
    expect(topFace(r.x, r.z, 0)).toBe(value)
    for (const [kx, kz, yaw] of [
      [2, 3, 0.7],
      [-3, 1, 2.9],
      [5, -4, -1.2],
    ]) {
      expect(topFace(r.x + kx * 2 * Math.PI, r.z + kz * 2 * Math.PI, yaw)).toBe(value)
    }
  })

  it('mặt đối diện cộng lại bằng 7, mỗi mặt có đúng số chấm', () => {
    for (const f of FACES) {
      const opposite = FACES.find((g) => g.normal.every((c, i) => c === -f.normal[i]))
      expect(f.value + (opposite?.value ?? 0)).toBe(7)
      expect(pipLayout(f.value)).toHaveLength(f.value)
    }
  })
})
