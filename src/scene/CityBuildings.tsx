/**
 * Công trình đặc trưng theo bản đồ "Vòng quanh thế giới", dựng bằng hình khối cơ bản (low-poly):
 * - Nhà nhỏ (cấp 1–3): mỗi khu vực (nhóm màu) một kiểu nhà. Mái/điểm nhấn tô màu người sở hữu.
 * - Landmark (cấp 4): riêng từng thành phố. Thành phố chưa có mẫu riêng thì dùng Landmark chung.
 * Đáy mọi công trình đặt tại y = 0. Màu vật liệu ở `visual.ts › landmarks`.
 */
import type { ReactNode } from 'react'
import type { ColorGroupId } from '../config/board'
import { useVisual } from '../store/visualStore'
import { Mat } from './Mat'

type V3 = [number, number, number]

function Box({ size, position, color, rotationY = 0 }: { size: V3; position: V3; color: string; rotationY?: number }) {
  return (
    <mesh position={position} rotation-y={rotationY} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Mat color={color} />
    </mesh>
  )
}

/** Khối chóp/cụt đều cạnh (segments = 4 → chóp vuông). */
function Frustum({
  top,
  bottom,
  height,
  y,
  color,
  segments = 4,
  x = 0,
  z = 0,
}: {
  top: number
  bottom: number
  height: number
  y: number
  color: string
  segments?: number
  x?: number
  z?: number
}) {
  return (
    <mesh position={[x, y + height / 2, z]} rotation-y={segments === 4 ? Math.PI / 4 : 0} castShadow receiveShadow>
      <cylinderGeometry args={[top, bottom, height, segments]} />
      <Mat color={color} />
    </mesh>
  )
}

/** Mái hai mái (lăng trụ tam giác) dọc theo trục x. */
function GableRoof({ width, depth, height, y, color }: { width: number; depth: number; height: number; y: number; color: string }) {
  return (
    <mesh position={[0, y + height / 3, 0]} rotation={[0, 0, Math.PI / 2]} scale={[height * 1.33, width, depth * 0.95]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 1, 3]} />
      <Mat color={color} />
    </mesh>
  )
}

/** Cửa sổ/cửa trên mặt trước (+z). */
function Face({ w, h, x = 0, y, z, color }: { w: number; h: number; x?: number; y: number; z: number; color: string }) {
  return (
    <mesh position={[x, y, z + 0.002]}>
      <planeGeometry args={[w, h]} />
      <Mat color={color} />
    </mesh>
  )
}

// ---------- Nhà nhỏ theo khu vực ----------

export function RegionalHouse({ group, color }: { group: ColorGroupId | null; color: string }) {
  const { buildings: b, landmarks: m } = useVisual()
  const s = b.houseSize
  switch (group) {
    case 'brown': {
      // Châu Phi: nhà đất mái bằng, viền mái màu chủ.
      const h = s * 0.7
      return (
        <group>
          <Box size={[s, h, s]} position={[0, h / 2, 0]} color={m.adobe} />
          <Box size={[s * 1.06, s * 0.1, s * 1.06]} position={[0, h + s * 0.05, 0]} color={color} />
          <Face w={s * 0.26} h={s * 0.4} y={s * 0.2} z={s / 2} color={m.adobeDark} />
          <Face w={s * 0.14} h={s * 0.14} x={s * 0.28} y={h * 0.65} z={s / 2} color={m.adobeDark} />
        </group>
      )
    }
    case 'lightBlue': {
      // Đông Nam Á: nhà sàn gỗ, mái dốc cao.
      const post = s * 0.28
      const h = s * 0.5
      return (
        <group>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[s * 0.07, post, s * 0.07]} position={[sx * s * 0.4, post / 2, sz * s * 0.4]} color={m.woodDark} />),
          )}
          <Box size={[s, h, s]} position={[0, post + h / 2, 0]} color={m.wood} />
          <Frustum top={0.001} bottom={s * 0.85} height={s * 0.7} y={post + h} color={color} />
          <Face w={s * 0.3} h={s * 0.24} y={post + h * 0.5} z={s / 2} color={b.window} />
        </group>
      )
    }
    case 'pink': {
      // Nam Mỹ: nhà thuộc địa sơn màu, mái thấp, ban công.
      const h = s * 0.85
      return (
        <group>
          <Box size={[s, h, s]} position={[0, h / 2, 0]} color={m.colonial} />
          <Frustum top={s * 0.25} bottom={s * 0.8} height={s * 0.32} y={h} color={color} />
          <Box size={[s * 0.8, s * 0.05, s * 0.14]} position={[0, h * 0.55, s * 0.55]} color={m.balcony} />
          <Face w={s * 0.22} h={s * 0.26} x={-s * 0.2} y={h * 0.75} z={s / 2} color={b.window} />
          <Face w={s * 0.22} h={s * 0.26} x={s * 0.2} y={h * 0.75} z={s / 2} color={b.window} />
          <Face w={s * 0.24} h={s * 0.34} y={s * 0.17} z={s / 2} color={m.woodDark} />
        </group>
      )
    }
    case 'orange': {
      // Trung Đông: khối trắng + mái vòm màu chủ.
      const h = s * 0.7
      return (
        <group>
          <Box size={[s, h, s]} position={[0, h / 2, 0]} color={m.whitewash} />
          <mesh position={[0, h, 0]} castShadow>
            <sphereGeometry args={[s * 0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={color} />
          </mesh>
          <Box size={[s * 0.06, s * 0.14, s * 0.06]} position={[0, h + s * 0.44, 0]} color={m.gold} />
          <Face w={s * 0.24} h={s * 0.36} y={s * 0.2} z={s / 2} color={m.stoneDark} />
        </group>
      )
    }
    case 'red': {
      // Đông Á: nhà hai tầng mái cong kiểu chùa.
      const h1 = s * 0.5
      const h2 = s * 0.32
      return (
        <group>
          <Box size={[s * 0.8, h1, s * 0.8]} position={[0, h1 / 2, 0]} color={m.paper} />
          <Frustum top={s * 0.4} bottom={s * 0.74} height={s * 0.18} y={h1} color={color} />
          <Box size={[s * 0.55, h2, s * 0.55]} position={[0, h1 + s * 0.18 + h2 / 2, 0]} color={m.paper} />
          <Frustum top={0.001} bottom={s * 0.6} height={s * 0.3} y={h1 + s * 0.18 + h2} color={color} />
          <Face w={s * 0.3} h={s * 0.3} y={h1 * 0.45} z={s * 0.45} color={m.lacquer} />
        </group>
      )
    }
    case 'yellow': {
      // Châu Âu: nhà phố cao, mái hai mái nhọn, ống khói.
      const h = s * 1.05
      const w = s * 0.75
      return (
        <group>
          <Box size={[w, h, s]} position={[0, h / 2, 0]} color={m.townhouse} />
          <GableRoof width={w * 1.1} depth={s * 1.05} height={s * 0.5} y={h} color={color} />
          <Box size={[s * 0.1, s * 0.3, s * 0.1]} position={[w * 0.28, h + s * 0.28, -s * 0.2]} color={m.brick} />
          {[0.3, 0.68].map((t) => (
            <Face key={t} w={w * 0.45} h={s * 0.2} y={h * t} z={s / 2} color={b.window} />
          ))}
        </group>
      )
    }
    case 'darkBlue': {
      // Biểu tượng toàn cầu: tòa nhà kính cao, đỉnh màu chủ.
      const h = s * 1.5
      const w = s * 0.7
      return (
        <group>
          <Box size={[w, h, w]} position={[0, h / 2, 0]} color={m.glass} />
          {[0.2, 0.4, 0.6, 0.8].map((t) => (
            <Box key={t} size={[w * 1.02, s * 0.03, w * 1.02]} position={[0, h * t, 0]} color={m.glassDark} />
          ))}
          <Box size={[w * 1.08, s * 0.12, w * 1.08]} position={[0, h + s * 0.06, 0]} color={color} />
        </group>
      )
    }
    default:
      return null
  }
}

// ---------- Landmark riêng từng thành phố ----------

function Plinth({ color, size = 0.5, children }: { color: string; size?: number; children: ReactNode }) {
  const { landmarks: m } = useVisual()
  return (
    <group scale={m.scale}>
      <mesh position={[0, m.plinth / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[size * 0.62, size * 0.66, m.plinth, 4]} />
        <Mat color={color} />
      </mesh>
      <group position={[0, m.plinth, 0]}>{children}</group>
    </group>
  )
}

/** Paris — tháp Eiffel: 4 chân xòe, 2 tầng sàn, ngọn nhọn. */
function Eiffel({ color }: { color: string }) {
  const { landmarks: m } = useVisual()
  const legs: V3[] = [
    [1, 0, 1],
    [1, 0, -1],
    [-1, 0, 1],
    [-1, 0, -1],
  ]
  return (
    <Plinth color={color} size={0.56}>
      {/* chân tháp nghiêng vào trong */}
      {legs.map(([sx, , sz], i) => (
        <mesh key={i} position={[sx * 0.11, 0.14, sz * 0.11]} rotation={[sz * 0.42, 0, -sx * 0.42]} castShadow>
          <boxGeometry args={[0.06, 0.32, 0.06]} />
          <Mat color={m.iron} />
        </mesh>
      ))}
      <Box size={[0.3, 0.035, 0.3]} position={[0, 0.27, 0]} color={m.iron} />
      <Frustum top={0.055} bottom={0.12} height={0.3} y={0.29} color={m.iron} />
      <Box size={[0.17, 0.03, 0.17]} position={[0, 0.6, 0]} color={m.iron} />
      <Frustum top={0.012} bottom={0.055} height={0.42} y={0.615} color={m.iron} />
      <Box size={[0.05, 0.05, 0.05]} position={[0, 1.04, 0]} color={color} />
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.005, 0.008, 0.12, 6]} />
        <Mat color={m.iron} />
      </mesh>
    </Plinth>
  )
}

/** London — Big Ben: tháp vuông, mặt đồng hồ 4 phía, chóp nhọn. */
function BigBen({ color }: { color: string }) {
  const { landmarks: m } = useVisual()
  const w = 0.2
  const clockY = 0.68
  return (
    <Plinth color={color} size={0.42}>
      <Box size={[w, 0.6, w]} position={[0, 0.3, 0]} color={m.stone} />
      {[0.15, 0.3, 0.45].map((t) => (
        <Face key={t} w={w * 0.5} h={0.07} y={t} z={w / 2} color={m.stoneDark} />
      ))}
      <Box size={[w * 1.18, 0.2, w * 1.18]} position={[0, clockY, 0]} color={m.stone} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} rotation-y={r}>
          <mesh position={[0, clockY, w * 0.59 + 0.002]}>
            <circleGeometry args={[0.075, 24]} />
            <Mat color={m.clock} />
          </mesh>
          <mesh position={[0, clockY + 0.02, w * 0.59 + 0.004]}>
            <planeGeometry args={[0.01, 0.05]} />
            <Mat color={m.slate} />
          </mesh>
          <mesh position={[0.015, clockY, w * 0.59 + 0.004]} rotation-z={Math.PI / 2}>
            <planeGeometry args={[0.01, 0.035]} />
            <Mat color={m.slate} />
          </mesh>
        </group>
      ))}
      <Box size={[w * 1.05, 0.1, w * 1.05]} position={[0, 0.83, 0]} color={m.stoneDark} />
      <Frustum top={0.001} bottom={w * 0.78} height={0.32} y={0.88} color={m.slate} />
      <Box size={[0.03, 0.03, 0.03]} position={[0, 1.21, 0]} color={color} />
    </Plinth>
  )
}

/** Hà Nội — Tháp Rùa trên gò đất giữa Hồ Gươm. */
function TurtleTower({ color }: { color: string }) {
  const { landmarks: m } = useVisual()
  return (
    <group scale={m.scale}>
      {/* mặt hồ */}
      <mesh position={[0, 0.006, 0]} receiveShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.012, 28]} />
        <Mat color={m.water} />
      </mesh>
      {/* gò đất có cỏ */}
      <mesh position={[0, 0.02, 0]} scale={[1, 0.28, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={m.moss} />
      </mesh>
      <mesh position={[-0.12, 0.08, 0.06]} castShadow>
        <sphereGeometry args={[0.06, 10, 8]} />
        <Mat color={m.moss} />
      </mesh>
      <group position={[0.02, 0.06, -0.02]}>
        {/* 3 tầng thu nhỏ dần, cửa vòm */}
        {[
          [0.17, 0.16, 0],
          [0.13, 0.13, 0.16],
          [0.095, 0.1, 0.29],
        ].map(([w, h, y]) => (
          <group key={y}>
            <Box size={[w, h, w]} position={[0, y + h / 2, 0]} color={m.cream} />
            <mesh position={[0, y + h * 0.45, w / 2 + 0.002]}>
              <circleGeometry args={[w * 0.22, 12, 0, Math.PI]} />
              <Mat color={m.stoneDark} />
            </mesh>
            <Face w={w * 0.44} h={h * 0.3} y={y + h * 0.3} z={w / 2} color={m.stoneDark} />
            <Box size={[w * 1.12, 0.018, w * 1.12]} position={[0, y + h, 0]} color={m.stoneDark} />
          </group>
        ))}
        {/* mái nhỏ trên đỉnh */}
        <Frustum top={0.001} bottom={0.075} height={0.1} y={0.4} color={color} />
      </group>
    </group>
  )
}

/** Dubai — Burj Khalifa: các tầng kính thon dần, ngọn kim cao. */
function BurjKhalifa({ color }: { color: string }) {
  const { landmarks: m } = useVisual()
  const tiers: Array<[number, number]> = [
    [0.13, 0.34],
    [0.1, 0.28],
    [0.075, 0.24],
    [0.05, 0.2],
    [0.03, 0.14],
  ]
  const starts = tiers.map((_, i) => tiers.slice(0, i).reduce((sum, [, h]) => sum + h, 0))
  const y = starts[starts.length - 1] + tiers[tiers.length - 1][1]
  return (
    <Plinth color={color} size={0.42}>
      {tiers.map(([r, h], i) => (
        <Frustum key={i} top={r * 0.82} bottom={r} height={h} y={starts[i]} color={i % 2 ? m.glassDark : m.glass} segments={6} />
      ))}
      <mesh position={[0, y + 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.004, 0.02, 0.26, 6]} />
        <Mat color={m.glass} />
      </mesh>
      <Box size={[0.03, 0.03, 0.03]} position={[0, y + 0.02, 0]} color={color} />
    </Plinth>
  )
}

const CITY_LANDMARKS: Record<string, (props: { color: string }) => ReactNode> = {
  Paris: Eiffel,
  London: BigBen,
  'Hà Nội': TurtleTower,
  Dubai: BurjKhalifa,
}

/** Landmark riêng của thành phố `cityName`; chưa có mẫu riêng thì hiện `fallback` (Landmark chung). */
export function CityLandmark({ cityName, color, fallback }: { cityName: string; color: string; fallback: ReactNode }) {
  const Model = CITY_LANDMARKS[cityName]
  return Model ? <Model color={color} /> : fallback
}
