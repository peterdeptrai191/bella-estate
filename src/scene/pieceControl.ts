/** Điều khiển quân cờ bằng lệnh — event player gọi để nhảy/bay/dịch chuyển. */
import gsap from 'gsap'
import { type Group, type Object3D, Vector3 } from 'three'
import { useVisualStore } from '../store/visualStore'

interface PieceRefs {
  /** Nhóm ngoài: vị trí trên bàn cờ. */
  root: Group
  /** Nhóm trong: hướng quay, co giãn. */
  body: Group
}

export const pieceRefs = new Map<string, PieceRefs>()
/** Quân đang được event player điều khiển — bỏ qua tween xếp chỗ tự động. */
export const controlled = new Set<string>()


function shortestYaw(current: number, target: number): number {
  let delta = (target - current) % (Math.PI * 2)
  if (delta > Math.PI) delta -= Math.PI * 2
  if (delta < -Math.PI) delta += Math.PI * 2
  return current + delta
}

export function pieceObject(id: string): Object3D | undefined {
  return pieceRefs.get(id)?.root
}

export function beginControl(id: string): void {
  controlled.add(id)
}

export function endControl(id: string): void {
  controlled.delete(id)
}

/** Nhảy theo vòng cung tới [x, z] với squash & stretch. `height` mặc định = hopHeight. */
export function arcTo(id: string, x: number, z: number, mode: 'hop' | 'fly'): Promise<void> {
  const refs = pieceRefs.get(id)
  if (!refs) return Promise.resolve()
  const { root, body } = refs
  const a = useVisualStore.getState().visual.animation
  const d = mode === 'fly' ? a.flyDuration : a.hopDuration
  const h = mode === 'fly' ? a.flyHeight : a.hopHeight
  const s = a.squash
  const from = root.position.clone()
  const to = new Vector3(x, from.y, z)
  const yaw = shortestYaw(body.rotation.y, Math.atan2(x - from.x, z - from.z))
  const proxy = { t: 0 }
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: () => resolve() })
      .to(body.rotation, { y: yaw, duration: d * 0.3, ease: 'power2.out' }, 0)
      // Lấy đà: nén xuống
      .to(body.scale, { x: 1 + s, y: 1 - s, z: 1 + s, duration: d * 0.15, ease: 'power1.out' }, 0)
      // Bay: vươn dài rồi trở lại bình thường ở đỉnh
      .to(
        proxy,
        {
          t: 1,
          duration: d * 0.7,
          ease: 'none',
          onUpdate: () => {
            root.position.lerpVectors(from, to, proxy.t)
            root.position.y = from.y + Math.sin(Math.PI * proxy.t) * h
          },
        },
        d * 0.15,
      )
      .to(body.scale, { x: 1 - s * 0.6, y: 1 + s, z: 1 - s * 0.6, duration: d * 0.25, ease: 'power1.out' }, d * 0.15)
      .to(body.scale, { x: 1, y: 1, z: 1, duration: d * 0.3, ease: 'sine.inOut' }, d * 0.4)
      // Chạm đất: nén rồi nảy về
      .to(body.scale, { x: 1 + s, y: 1 - s, z: 1 + s, duration: d * 0.1, ease: 'power1.in' }, d * 0.85)
      .to(body.scale, { x: 1, y: 1, z: 1, duration: d * 0.25, ease: 'back.out(3)' }, d * 0.95)
  })
}

/** Dịch chuyển tức thời: thu nhỏ, đổi chỗ, hiện lại. */
export function teleportTo(id: string, x: number, z: number): Promise<void> {
  const refs = pieceRefs.get(id)
  if (!refs) return Promise.resolve()
  const { root, body } = refs
  const d = useVisualStore.getState().visual.animation.teleportDuration
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: () => resolve() })
      .to(body.scale, { x: 0, y: 0, z: 0, duration: d / 2, ease: 'back.in(2)' })
      .add(() => {
        root.position.x = x
        root.position.z = z
      })
      .to(body.scale, { x: 1, y: 1, z: 1, duration: d / 2, ease: 'back.out(2)' })
  })
}

/** Quân phá sản biến mất. */
export function vanish(id: string): Promise<void> {
  const refs = pieceRefs.get(id)
  if (!refs) return Promise.resolve()
  const d = useVisualStore.getState().visual.animation.teleportDuration
  return new Promise((resolve) => {
    gsap.to(refs.body.scale, { x: 0, y: 0, z: 0, duration: d, ease: 'back.in(2)', onComplete: () => resolve() })
  })
}
