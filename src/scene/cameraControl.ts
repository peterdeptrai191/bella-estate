import type { Object3D } from 'three'

let followTarget: Object3D | null = null

/** Camera bám theo quân đang di chuyển (null = về toàn cảnh bàn cờ). */
export function followPiece(target: Object3D | null): void {
  followTarget = target
}

export function getFollowTarget(): Object3D | null {
  return followTarget
}
