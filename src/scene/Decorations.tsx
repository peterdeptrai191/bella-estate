/**
 * Trang trí thêm theo trạng thái ván:
 * - ResortDecor: Khu Du Lịch đã có chủ → bãi biển đông vui (ghế nằm, ô dù, quầy bar mái màu chủ, phao, cọ).
 * - FestivalCelebration: thành phố đang tổ chức Lễ Hội → cột cờ dây, bóng bay, pháo hoa, kim tuyến, vầng sáng.
 * Đáy đặt tại y = 0 của mặt ô; thông số ở visual.ts › decor.
 */
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { festivalMultiplier } from '../game-core'
import { useAnimationStore } from '../store/animationStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout } from './boardLayout'
import { Mat } from './Mat'
import { PalmTree } from './TileProps'
import { TEXT_CHARACTERS } from './textAtlas'

function Umbrella({ position, color, tilt = 0 }: { position: [number, number, number]; color: string; tilt?: number }) {
  const { props } = useVisual()
  return (
    <group position={position} rotation-z={tilt}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        <Mat color={props.pole} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <coneGeometry args={[0.15, 0.08, 8]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

function Lounger({ position, color, rotation = 0 }: { position: [number, number, number]; color: string; rotation?: number }) {
  const { props } = useVisual()
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.02, 0.22]} />
        <Mat color={props.paper} />
      </mesh>
      <mesh position={[0, 0.045, 0.02]} castShadow>
        <boxGeometry args={[0.085, 0.012, 0.16]} />
        <Mat color={color} />
      </mesh>
      {/* Tựa lưng */}
      <mesh position={[0, 0.07, -0.09]} rotation-x={-0.7} castShadow>
        <boxGeometry args={[0.1, 0.012, 0.09]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

/** Bãi biển của Khu Du Lịch khi đã có người mua; `color` = màu người chủ. */
export function ResortDecor({ color }: { color: string }) {
  const { colors, decor } = useVisual()
  return (
    <group>
      {/* Dải cát dọc mép hồ */}
      <mesh position={[0, 0.006, 0.13]} receiveShadow>
        <boxGeometry args={[0.86, 0.012, 0.2]} />
        <Mat color={colors.sand} />
      </mesh>
      <Lounger position={[-0.3, 0, 0.13]} color={color} rotation={0.15} />
      <Lounger position={[-0.14, 0, 0.13]} color={decor.resortAccent} rotation={-0.1} />
      <Umbrella position={[-0.22, 0, 0.03]} color={color} tilt={0.12} />
      {/* Quầy bar mái sọc màu chủ */}
      <group position={[0.27, 0, 0.08]}>
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.12, 0.14]} />
          <Mat color={decor.wood} />
        </mesh>
        {[-0.07, 0, 0.07].map((x, i) => (
          <mesh key={x} position={[x, 0.19, 0]} castShadow>
            <boxGeometry args={[0.07, 0.025, 0.2]} />
            <Mat color={i === 1 ? colors.tile : color} />
          </mesh>
        ))}
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.155, 0.08]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.07, 5]} />
            <Mat color={decor.wood} />
          </mesh>
        ))}
      </group>
      {/* Phao bơi trên hồ và bóng bãi biển */}
      <mesh position={[-0.12, 0.028, -0.08]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.045, 0.016, 8, 16]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0.05, 0.035, 0.16]} castShadow>
        <sphereGeometry args={[0.03, 10, 8]} />
        <Mat color={decor.resortAccent} />
      </mesh>
      <PalmTree position={[0.36, 0, -0.32]} scale={0.8} />
      <PalmTree position={[-0.38, 0, -0.3]} scale={0.7} />
    </group>
  )
}

/** Chuỗi cờ đuôi nheo căng giữa hai điểm (võng xuống một chút). */
function Bunting({ from, to, colors, count }: { from: [number, number, number]; to: [number, number, number]; colors: readonly string[]; count: number }) {
  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    const sag = Math.sin(t * Math.PI) * 0.08
    return {
      pos: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag, from[2] + (to[2] - from[2]) * t] as [number, number, number],
      color: colors[i % colors.length],
    }
  })
  const angle = Math.atan2(to[0] - from[0], to[2] - from[2])
  return (
    <group>
      {flags.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={[0, angle + Math.PI / 2, Math.PI]} castShadow>
          <coneGeometry args={[0.045, 0.1, 3]} />
          <Mat color={f.color} />
        </mesh>
      ))}
    </group>
  )
}

const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Lễ Hội Thế Giới đang diễn ra ở một thành phố: trang trí lộng lẫy, có chuyển động. */
export function FestivalCelebration() {
  const visual = useVisual()
  const { board, decor } = visual
  const layout = useMemo(() => computeTileLayout(board), [board])
  const festivalTile = useAnimationStore((s) => s.view?.festivalTile ?? null)
  const festivalCount = useAnimationStore((s) => s.view?.festivalCount ?? 0)
  const balloons = useRef<Group>(null)
  const confetti = useRef<Group>(null)
  const fireworks = useRef<Group>(null)
  const glow = useRef<MeshBasicMaterial>(null)
  const sign = useRef<Group>(null)

  const confettiSeeds = useMemo(() => Array.from({ length: decor.confettiCount }, (_, i) => i), [decor.confettiCount])
  const burstDirs = useMemo(
    () =>
      Array.from({ length: decor.burstSparks }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / decor.burstSparks)
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)] as [number, number, number]
      }),
    [decor.burstSparks],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (glow.current) glow.current.opacity = decor.glowOpacity * (0.6 + 0.4 * Math.sin(t * 3))
    balloons.current?.children.forEach((b, i) => {
      b.position.y = decor.balloonHeight + Math.sin(t * 1.6 + i * 1.3) * 0.05
      b.rotation.z = Math.sin(t * 1.1 + i) * 0.12
    })
    if (sign.current) sign.current.position.y = decor.signHeight + Math.sin(t * 2) * 0.04
    // Kim tuyến bay lên rồi quay vòng.
    confetti.current?.children.forEach((c, i) => {
      const speed = 0.25 + rand(i + 1) * 0.35
      const phase = (t * speed + rand(i + 7)) % 1
      c.position.y = 0.1 + phase * decor.confettiHeight
      c.rotation.set(t * 3 + i, t * 2 + i * 0.5, 0)
      c.scale.setScalar(phase < 0.85 ? 1 : (1 - phase) / 0.15)
    })
    // Pháo hoa: 2 chùm nổ luân phiên.
    fireworks.current?.children.forEach((burst, k) => {
      const period = decor.burstPeriod
      const p = ((t + k * period * 0.5) % period) / period
      burst.visible = p < 0.6
      const r = (p / 0.6) * decor.burstRadius
      burst.children.forEach((spark, i) => {
        const d = burstDirs.at(i)
        if (!d) return
        spark.position.set(d[0] * r, d[1] * r - p * p * 0.25, d[2] * r)
        const mat = (spark as Mesh).material as MeshBasicMaterial
        mat.opacity = 1 - p / 0.6
      })
    })
  })

  const tile = festivalTile === null ? undefined : layout.at(festivalTile)
  if (!tile) return null
  const w = tile.width - board.tileGap
  const d = tile.depth - board.tileGap
  const top = board.tileHeight + board.stripHeight
  const corners: Array<[number, number]> = [
    [-w / 2 + 0.05, -d / 2 + 0.05],
    [w / 2 - 0.05, -d / 2 + 0.05],
    [w / 2 - 0.05, d / 2 - 0.05],
    [-w / 2 + 0.05, d / 2 - 0.05],
  ]
  const poleTop = top + decor.poleHeight
  return (
    <group position={[tile.x, 0, tile.z]} rotation-y={tile.rotationY}>
      {/* Vầng sáng vàng nhấp nháy dưới chân */}
      <mesh position={[0, top + 0.006, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
        <planeGeometry args={[w + 0.12, d + 0.12]} />
        <meshBasicMaterial ref={glow} color={decor.glowColor} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* 4 cột cờ góc + dây cờ đuôi nheo quanh ô */}
      {corners.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, top + decor.poleHeight / 2, z]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, decor.poleHeight, 6]} />
            <Mat color={decor.gold} />
          </mesh>
          <mesh position={[x, poleTop + 0.025, z]} castShadow>
            <sphereGeometry args={[0.03, 10, 8]} />
            <Mat color={decor.gold} />
          </mesh>
        </group>
      ))}
      {corners.map(([x, z], i) => {
        const [x2, z2] = corners[(i + 1) % corners.length]
        return (
          <Bunting
            key={`b${i}`}
            from={[x, poleTop, z]}
            to={[x2, poleTop, z2]}
            colors={decor.flagColors}
            count={Math.max(4, Math.round(Math.hypot(x2 - x, z2 - z) / 0.11))}
          />
        )
      })}
      {/* Chùm bóng bay */}
      <group ref={balloons} position={[0, 0, -d * 0.18]}>
        {decor.balloonColors.map((c, i) => {
          const a = (i / decor.balloonColors.length) * Math.PI * 2
          return (
            <group key={i} position={[Math.cos(a) * decor.balloonSize * 1.9, decor.balloonHeight, Math.sin(a) * decor.balloonSize * 1.9]}>
              <mesh castShadow scale={[1, 1.18, 1]}>
                <sphereGeometry args={[decor.balloonSize, 14, 10]} />
                <Mat color={c} />
              </mesh>
              <mesh position={[0, -decor.balloonHeight / 2 + top / 2, 0]}>
                <cylinderGeometry args={[0.003, 0.003, decor.balloonHeight - top, 4]} />
                <Mat color={decor.string} />
              </mesh>
            </group>
          )
        })}
      </group>
      {/* Kim tuyến */}
      <group ref={confetti}>
        {confettiSeeds.map((i) => (
          <mesh key={i} position={[(rand(i + 3) - 0.5) * w, 0.2, (rand(i + 5) - 0.5) * d]} raycast={() => null}>
            <boxGeometry args={[0.03, 0.03, 0.004]} />
            <meshBasicMaterial color={decor.flagColors[i % decor.flagColors.length]} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Pháo hoa */}
      <group ref={fireworks}>
        {[0, 1].map((k) => (
          <group key={k} position={[k === 0 ? -w * 0.25 : w * 0.25, top + decor.burstHeight + k * 0.15, k === 0 ? d * 0.1 : -d * 0.15]}>
            {burstDirs.map((_, i) => (
              <mesh key={i} raycast={() => null}>
                <sphereGeometry args={[0.018, 6, 4]} />
                <meshBasicMaterial color={decor.burstColors[(i + k) % decor.burstColors.length]} transparent depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* Bảng "LỄ HỘI x2/x3…" lơ lửng, luôn quay về phía camera */}
      <group ref={sign} position={[0, decor.signHeight, 0]}>
        <Billboard>
          <Text
            font={visual.tileText.font}
            fontSize={decor.signFontSize}
            color={decor.signColor}
            outlineColor={decor.signOutline}
            outlineWidth="14%"
            anchorX="center"
            anchorY="middle"
            sdfGlyphSize={visual.tileText.sdfGlyphSize}
            characters={TEXT_CHARACTERS}
            raycast={() => null}
          >
            {`${decor.signText} x${festivalMultiplier(festivalCount || 1)}`}
          </Text>
        </Billboard>
      </group>
    </group>
  )
}
