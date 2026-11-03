import gsap from 'gsap'
import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { Group, Vector3 } from 'three'
import { useVisualStore } from '../store/visualStore'
import { spawnDust } from './fxControl'

/**
 * Bọc công trình: khi `animate` lúc mount thì mọc lên scale 0 → 1.15 → 1 kèm bụi.
 * Công trình có sẵn từ đầu (animate = false) hiện luôn.
 */
export function Pop({ animate, children }: { animate: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    const g = ref.current
    if (!g || !animate) return
    const a = useVisualStore.getState().visual.animation
    g.scale.setScalar(0)
    spawnDust(g.getWorldPosition(new Vector3()))
    const tl = gsap
      .timeline()
      .to(g.scale, { x: a.buildOvershoot, y: a.buildOvershoot, z: a.buildOvershoot, duration: a.buildDuration * 0.6, ease: 'power2.out' })
      .to(g.scale, { x: 1, y: 1, z: 1, duration: a.buildDuration * 0.4, ease: 'sine.inOut' })
    return () => {
      tl.kill()
    }
    // Chỉ chạy khi mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <group ref={ref}>{children}</group>
}
