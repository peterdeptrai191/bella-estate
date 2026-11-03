/** Hiệu ứng điều khiển bằng lệnh (không qua React state): tiền bay, bụi khi xây nhà. */
import gsap from 'gsap'
import { CylinderGeometry, type Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import { useVisualStore } from '../store/visualStore'

let fxRoot: Group | null = null

export function setFxRoot(root: Group | null): void {
  fxRoot = root
}

const coinGeometry = new CylinderGeometry(0.5, 0.5, 0.22, 20)
const dustGeometry = new SphereGeometry(0.5, 8, 6)
const materials = new Map<string, MeshStandardMaterial>()
function material(color: string) {
  let m = materials.get(color)
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 })
    materials.set(color, m)
  }
  return m
}

/** Tiền bay theo vòng cung từ `from` tới `to`. `onEach` gọi khi từng đồng xu tới nơi. */
export function flyCoins(from: Vector3, to: Vector3, onEach?: (i: number) => void): Promise<void> {
  const root = fxRoot
  const a = useVisualStore.getState().visual.animation
  if (!root || a.coinCount <= 0) return Promise.resolve()
  const promises = Array.from({ length: a.coinCount }, (_, i) => {
    const coin = new Mesh(coinGeometry, material(a.coinColor))
    coin.scale.setScalar(a.coinSize)
    coin.rotation.x = Math.PI / 2
    coin.castShadow = true
    coin.position.copy(from)
    coin.visible = false
    root.add(coin)
    const jitter = new Vector3((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25)
    const end = to.clone().add(jitter)
    const proxy = { t: 0 }
    return new Promise<void>((resolve) => {
      gsap.to(proxy, {
        t: 1,
        duration: a.coinDuration,
        delay: i * a.coinStagger,
        ease: 'power1.inOut',
        onStart: () => {
          coin.visible = true
        },
        onUpdate: () => {
          coin.position.lerpVectors(from, end, proxy.t)
          coin.position.y += Math.sin(Math.PI * proxy.t) * a.coinHeight
          coin.rotation.z = proxy.t * Math.PI * 4
        },
        onComplete: () => {
          root.remove(coin)
          onEach?.(i)
          resolve()
        },
      })
    })
  })
  return Promise.all(promises).then(() => undefined)
}

/** Bụi hạt nhỏ toả ra quanh chân công trình vừa xây. */
export function spawnDust(at: Vector3): void {
  const root = fxRoot
  const a = useVisualStore.getState().visual.animation
  if (!root) return
  for (let i = 0; i < a.dustCount; i++) {
    const p = new Mesh(dustGeometry, material(a.dustColor))
    const size = 0.05 + Math.random() * 0.05
    p.scale.setScalar(size)
    p.position.copy(at)
    root.add(p)
    const angle = (i / a.dustCount) * Math.PI * 2 + Math.random() * 0.5
    const dist = 0.25 + Math.random() * 0.25
    const tl = gsap.timeline({ onComplete: () => void root.remove(p) })
    tl.to(p.position, {
      x: at.x + Math.cos(angle) * dist,
      z: at.z + Math.sin(angle) * dist,
      y: at.y + 0.08 + Math.random() * 0.15,
      duration: a.dustDuration,
      ease: 'power2.out',
    })
    tl.to(p.scale, { x: 0, y: 0, z: 0, duration: a.dustDuration * 0.6, ease: 'power1.in' }, a.dustDuration * 0.4)
  }
}
