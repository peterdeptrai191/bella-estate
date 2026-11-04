/** Đồ trang trí trên các ô đặc biệt, dựng bằng hình khối cơ bản. Đáy đặt tại y = 0. */
import type { TileKind } from '../config/board'
import { useVisual } from '../store/visualStore'
import { Mat } from './Mat'

function PalmTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const { props } = useVisual()
  return (
    <group position={position} scale={scale}>
      <mesh position={[0.03, 0.22, 0]} rotation-z={-0.15} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.45, 6]} />
        <Mat color={props.trunk} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0.06 + Math.cos((i * 2 * Math.PI) / 5) * 0.1, 0.44, Math.sin((i * 2 * Math.PI) / 5) * 0.1]}
          rotation={[Math.sin((i * 2 * Math.PI) / 5) * 0.6, 0, -Math.cos((i * 2 * Math.PI) / 5) * 0.6]}
          scale={[1, 0.25, 0.45]}
          castShadow
        >
          <sphereGeometry args={[0.13, 8, 6]} />
          <Mat color={props.leaf} />
        </mesh>
      ))}
    </group>
  )
}

function Island() {
  const { colors } = useVisual()
  return (
    <group position={[0.12, 0, -0.12]} scale={0.85}>
      <mesh position={[0, 0, 0]} scale={[1, 0.22, 1]} receiveShadow castShadow>
        <sphereGeometry args={[0.48, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={colors.sand} />
      </mesh>
      <PalmTree position={[-0.08, 0.08, 0.02]} scale={1.3} />
      <PalmTree position={[0.2, 0.05, -0.18]} scale={0.9} />
    </group>
  )
}

function Flag({ position, color, height = 0.55 }: { position: [number, number, number]; color: string; height?: number }) {
  const { props } = useVisual()
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, height, 6]} />
        <Mat color={props.pole} />
      </mesh>
      <mesh position={[0.09, height - 0.07, 0]} castShadow>
        <boxGeometry args={[0.18, 0.12, 0.012]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

function Start() {
  const { props } = useVisual()
  return (
    <group>
      {/* Mũi tên chỉ chiều đi (theo trục -x cục bộ) */}
      <mesh position={[0.1, 0.015, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.03, 0.16]} />
        <Mat color={props.gold} />
      </mesh>
      <mesh position={[-0.24, 0.015, 0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 3]} />
        <Mat color={props.gold} />
      </mesh>
      <Flag position={[0.42, 0, -0.35]} color={props.flag} height={0.7} />
      <Flag position={[-0.35, 0, -0.42]} color={props.gold} />
    </group>
  )
}

function Festival() {
  const { props, playerColors } = useVisual()
  return (
    <group position={[0, 0, -0.14]} scale={0.9}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.1, 24]} />
        <Mat color={props.paper} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.08, 24]} />
        <Mat color={props.flag} />
      </mesh>
      {playerColors.map((c, i) => {
        const a = (i / playerColors.length) * Math.PI * 2 + Math.PI / 4
        return <Flag key={i} position={[Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5]} color={c} height={0.5} />
      })}
    </group>
  )
}

function Airport() {
  const { props } = useVisual()
  return (
    <group>
      <mesh position={[0, 0.01, -0.02]} receiveShadow>
        <boxGeometry args={[1.2, 0.02, 0.32]} />
        <Mat color={props.pole} />
      </mesh>
      {[-0.4, -0.15, 0.1, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.022, -0.02]}>
          <boxGeometry args={[0.14, 0.005, 0.03]} />
          <Mat color={props.paper} />
        </mesh>
      ))}
      <group position={[0.32, 0, -0.32]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.6, 12]} />
          <Mat color={props.tower} />
        </mesh>
        <mesh position={[0, 0.66, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.13, 0.13, 12]} />
          <Mat color={props.glass} />
        </mesh>
        <mesh position={[0, 0.76, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.18, 0.08, 12]} />
          <Mat color={props.tower} />
        </mesh>
      </group>
    </group>
  )
}

function Chance() {
  const { playerColors, props } = useVisual()
  return (
    <group rotation-y={0.3}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.012 + i * 0.022, 0]} rotation-y={i * 0.25} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.02, 0.24]} />
          <Mat color={i === 2 ? playerColors[1] : props.paper} />
        </mesh>
      ))}
    </group>
  )
}

function Tax() {
  const { props } = useVisual()
  const stacks: Array<[number, number, number]> = [
    [-0.12, 0, -0.16],
    [0.1, 0, -0.22],
    [0.04, 0, -0.06],
  ]
  return (
    <group>
      {stacks.map(([x, , z], s) =>
        Array.from({ length: 3 + s }, (_, i) => (
          <mesh key={`${s}-${i}`} position={[x, 0.02 + i * 0.035, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
            <Mat color={props.gold} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Resort() {
  const { colors, props } = useVisual()
  return (
    <group>
      <mesh position={[-0.05, 0.012, -0.08]} receiveShadow>
        <boxGeometry args={[0.5, 0.02, 0.3]} />
        <Mat color={colors.water} />
      </mesh>
      <group position={[0.24, 0, -0.28]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.34, 6]} />
          <Mat color={props.pole} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow>
          <coneGeometry args={[0.2, 0.1, 8]} />
          <Mat color={props.umbrella} />
        </mesh>
      </group>
    </group>
  )
}

export function TileProps({ kind }: { kind: TileKind }) {
  switch (kind) {
    case 'START':
      return <Start />
    case 'ISLAND':
      return <Island />
    case 'FESTIVAL':
      return <Festival />
    case 'AIRPORT':
      return <Airport />
    case 'CHANCE':
      return <Chance />
    case 'TAX':
      return <Tax />
    case 'RESORT':
      return <Resort />
    case 'CITY':
      return null
  }
}
