/**
 * Tung xúc xắc. Kết quả do game-core quyết định trước; animation chỉ diễn lại:
 * bay lên, xoay, rơi, nảy nhẹ và dừng đúng mặt (không dùng physics).
 */
import gsap from 'gsap'
import type { Group } from 'three'
import { playSound } from '../audio/soundPlayer'
import { useVisualStore } from '../store/visualStore'
import { diceRestPositions } from './boardLayout'
import { faceRotation } from './diceMath'

interface DieRefs {
  outer: Group
  inner: Group
}
export const dieRefs: Array<DieRefs | null> = [null, null]

/** Tung hai viên tới kết quả `values`. Resolve khi cả hai đã dừng. */
export function rollDice(values: [number, number]): Promise<void> {
  const visual = useVisualStore.getState().visual
  const a = visual.animation
  const rest = diceRestPositions(visual)
  playSound('diceShake')
  const runs = dieRefs.map((refs, index) => {
    if (!refs) return Promise.resolve()
    const { outer, inner } = refs
    const [rx, ry, rz] = rest[index]
    const delay = index * 0.06
    const landX = rx + (Math.random() - 0.5) * 0.25
    const landZ = rz + (Math.random() - 0.5) * 0.25
    const air = a.diceRise + a.diceFall

    // Xoay nhiều vòng nhưng kết thúc đúng mặt: cộng bội số 2π vào góc đích.
    const face = faceRotation(values[index])
    const turns = (current: number, target: number, sign: number) => {
      const base = Math.round(current / (Math.PI * 2)) * Math.PI * 2
      return base + target + sign * Math.PI * 2 * (a.diceSpins + Math.floor(Math.random() * 2))
    }
    const signX = Math.random() < 0.5 ? -1 : 1
    const signZ = Math.random() < 0.5 ? -1 : 1
    const bounce = visual.dice.size * 0.35

    return new Promise<void>((resolve) => {
      gsap
        .timeline({ delay, onComplete: () => resolve() })
        .to(outer.position, { y: ry + a.diceHeight, x: (rx + landX) / 2, z: (rz + landZ) / 2, duration: a.diceRise, ease: 'power2.out' }, 0)
        .to(outer.position, { y: ry, x: landX, z: landZ, duration: a.diceFall, ease: 'power2.in' }, a.diceRise)
        .to(inner.rotation, { x: turns(inner.rotation.x, face.x, signX), z: turns(inner.rotation.z, face.z, signZ), duration: air, ease: 'power2.out' }, 0)
        .to(outer.rotation, { y: outer.rotation.y + (Math.random() - 0.5) * Math.PI, duration: air, ease: 'power2.out' }, 0)
        .add(() => index === 0 && playSound('diceLand', { jitter: true }), air)
        .to(outer.position, { y: ry + bounce, duration: a.diceBounce / 2, ease: 'power1.out' }, air)
        .to(outer.position, { y: ry, duration: a.diceBounce / 2, ease: 'power1.in' }, air + a.diceBounce / 2)
        .add(() => playSound('diceBounce', { jitter: true, volume: index === 0 ? 1 : 0.6 }), air + a.diceBounce)
    })
  })
  return Promise.all(runs).then(() => undefined)
}
