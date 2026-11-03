import { useVisual } from '../store/visualStore'
import { Mat } from './Mat'

/** Một căn nhà: thân hộp + mái chóp 4 mặt. Đáy đặt tại y = 0. */
export function House({ color, position = [0, 0, 0] }: { color: string; position?: [number, number, number] }) {
  const { buildings: b } = useVisual()
  const wall = b.houseSize * b.houseWallRatio
  const roof = b.houseSize * b.roofRatio
  return (
    <group position={position}>
      <mesh position={[0, wall / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.houseSize, wall, b.houseSize]} />
        <Mat color={b.wall} />
      </mesh>
      <mesh position={[0, wall + roof / 2, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[b.houseSize * 0.78, roof, 4]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, wall * 0.45, b.houseSize / 2 + 0.001]}>
        <planeGeometry args={[b.houseSize * 0.32, b.houseSize * 0.32]} />
        <Mat color={b.window} />
      </mesh>
    </group>
  )
}

/** Landmark: bậc đế + tháp cao + mái chóp + cờ. */
export function Landmark({ color }: { color: string }) {
  const { buildings: b, props } = useVisual()
  const w = b.landmarkWidth
  const h = b.landmarkHeight
  const plinth = w * 0.25
  const roof = w * 0.9
  return (
    <group>
      <mesh position={[0, plinth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 1.5, plinth, w * 1.5]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, plinth + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <Mat color={b.wall} />
      </mesh>
      {[0.3, 0.55, 0.8].map((t) => (
        <mesh key={t} position={[0, plinth + h * t, w / 2 + 0.001]}>
          <planeGeometry args={[w * 0.55, h * 0.1]} />
          <Mat color={b.window} />
        </mesh>
      ))}
      <mesh position={[0, plinth + h + roof / 2, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[w * 0.8, roof, 4]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, plinth + h + roof + 0.12, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.24, 6]} />
        <Mat color={props.pole} />
      </mesh>
      <mesh position={[0.06, plinth + h + roof + 0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.07, 0.01]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

/** Công trình trên một thành phố theo cấp: 1–3 nhà, 4 = Landmark. Nhà xếp dọc theo cạnh (trục x cục bộ). */
export function BuildingSet({ level, color, width }: { level: number; color: string; width: number }) {
  const { buildings: b } = useVisual()
  if (level <= 0) return null
  if (level >= 4) return <Landmark color={color} />
  const spacing = Math.min(b.houseSize * 1.35, width / level)
  return (
    <group>
      {Array.from({ length: level }, (_, i) => (
        <House key={i} color={color} position={[(i - (level - 1) / 2) * spacing, 0, 0]} />
      ))}
    </group>
  )
}
