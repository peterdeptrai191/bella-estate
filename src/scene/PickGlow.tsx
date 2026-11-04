import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshBasicMaterial } from 'three'
import { useVisual } from '../store/visualStore'

export type PickState = 'none' | 'available' | 'selected' | 'dim'

/** Lớp phủ trên mặt ô khi đang chọn ô: ô chọn được nhấp nháy, ô khác tối đi. */
export function PickGlow({ state, tone, w, d, y }: { state: PickState; tone: 'good' | 'bad'; w: number; d: number; y: number }) {
  const { pick } = useVisual()
  const material = useRef<MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const m = material.current
    if (!m || state !== 'available') return
    const t = (Math.sin(clock.elapsedTime * pick.pulseSpeed) + 1) / 2
    m.opacity = pick.opacityMin + (pick.opacityMax - pick.opacityMin) * t
  })

  if (state === 'none') return null
  const color = state === 'dim' ? '#1d2a3a' : state === 'selected' ? pick.selected : tone === 'bad' ? pick.bad : pick.good
  return (
    <RoundedBox
      args={[w, 0.02, d]}
      radius={0.01}
      smoothness={2}
      position={[0, y + 0.012, 0]}
      raycast={() => null}
      renderOrder={2}
    >
      <meshBasicMaterial
        ref={material}
        color={color}
        transparent
        depthWrite={false}
        opacity={state === 'dim' ? pick.dimOpacity : state === 'selected' ? pick.opacityMax : pick.opacityMin}
        toneMapped={false}
      />
    </RoundedBox>
  )
}
