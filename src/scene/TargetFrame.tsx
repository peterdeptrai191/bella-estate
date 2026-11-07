/** Viền vàng nhấp nháy quanh ô quân cờ sẽ dừng (sau khi tung xúc xắc). */
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { MeshBasicMaterial } from 'three'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout } from './boardLayout'

export function TargetFrame() {
  const { board, target } = useVisual()
  const layout = useMemo(() => computeTileLayout(board), [board])
  const index = useUiStore((s) => s.targetTile)
  // Vật liệu của 4 thanh, nhấp nháy đồng bộ.
  const materials = useRef<Array<MeshBasicMaterial | null>>([])
  useFrame(({ clock }) => {
    const t = (Math.sin(clock.elapsedTime * target.pulseSpeed) + 1) / 2
    for (const m of materials.current) if (m) m.opacity = target.opacityMin + (target.opacityMax - target.opacityMin) * t
  })

  const tile = index === null ? undefined : layout.at(index)
  if (!tile) return null
  const w = tile.width - board.tileGap + target.thickness
  const d = tile.depth - board.tileGap + target.thickness
  const y = board.tileHeight + board.stripHeight + target.lift
  const t = target.thickness
  // 4 thanh tạo thành khung chữ nhật quanh mép ô.
  const bars: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
    { pos: [0, y, d / 2 - t / 2], size: [w, target.height, t] },
    { pos: [0, y, -d / 2 + t / 2], size: [w, target.height, t] },
    { pos: [w / 2 - t / 2, y, 0], size: [t, target.height, d - 2 * t] },
    { pos: [-w / 2 + t / 2, y, 0], size: [t, target.height, d - 2 * t] },
  ]
  return (
    <group position={[tile.x, 0, tile.z]} rotation-y={tile.rotationY}>
      {bars.map((b, i) => (
        <mesh key={i} position={b.pos} raycast={() => null} renderOrder={3}>
          <boxGeometry args={b.size} />
          <meshBasicMaterial
            ref={(m) => {
              materials.current[i] = m
            }}
            color={target.color}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
