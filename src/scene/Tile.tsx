import { RoundedBox } from '@react-three/drei'
import { COLOR_GROUPS, RESORT_COLOR, type TileKind } from '../config/board'
import type { VisualConfig } from '../config/visual'
import { useVisual } from '../store/visualStore'
import type { TileTransform } from './boardLayout'
import { BuildingSet } from './Buildings'
import { Mat } from './Mat'
import { PickGlow, type PickState } from './PickGlow'
import { Pop } from './Pop'
import { useMountedFlag } from './useMountedFlag'
import { TileProps } from './TileProps'

function topColor(kind: TileKind, colors: VisualConfig['colors']): string {
  switch (kind) {
    case 'CITY':
      return colors.tile
    case 'START':
      return colors.start
    case 'ISLAND':
      return colors.water
    case 'FESTIVAL':
      return colors.festival
    case 'AIRPORT':
      return colors.airport
    case 'CHANCE':
      return colors.chance
    case 'TAX':
      return colors.tax
    case 'RESORT':
      return colors.resort
  }
}

export interface TileBuilding {
  /** Màu người sở hữu. */
  color: string
  level: number
}

/**
 * Một ô bàn cờ. Trục cục bộ: x dọc theo cạnh, z hướng ra ngoài bàn cờ.
 * Dải màu nhóm nằm phía trong (gần bãi cỏ), công trình/trang trí ở phần còn lại.
 */
export function Tile({
  layout,
  building,
  pick = 'none',
  pickTone = 'good',
  onSelect,
}: {
  layout: TileTransform
  building?: TileBuilding
  pick?: PickState
  pickTone?: 'good' | 'bad'
  onSelect?: (tileIndex: number) => void
}) {
  const { board, colors, props, pick: pickCfg } = useVisual()
  const mounted = useMountedFlag()
  const { def, width, depth } = layout
  const w = width - board.tileGap
  const d = depth - board.tileGap
  // Dải màu phía trong: màu nhóm (thành phố) hoặc màu xanh ngọc (Khu Du Lịch).
  const groupColor = def.group
    ? COLOR_GROUPS.find((g) => g.id === def.group)?.color
    : def.kind === 'RESORT'
      ? RESORT_COLOR
      : undefined
  const stripDepth = d * board.stripRatio
  const top = board.tileHeight
  // Tâm vùng đặt công trình: phần ô không có dải màu.
  const contentZ = groupColor ? stripDepth / 2 : 0

  return (
    <group
      position={[layout.x, pick === 'available' || pick === 'selected' ? pickCfg.lift : 0, layout.z]}
      rotation-y={layout.rotationY}
      onClick={(e) => {
        if (!onSelect) return
        e.stopPropagation()
        onSelect(def.index)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (onSelect && pick !== 'dim') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <RoundedBox
        args={[w, board.tileHeight, d]}
        radius={board.tileRadius}
        smoothness={board.tileSmoothness}
        position={[0, board.tileHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <Mat color={layout.isCorner ? (def.kind === 'ISLAND' ? colors.water : colors.corner) : topColor(def.kind, colors)} />
      </RoundedBox>

      {layout.isCorner && (
        <RoundedBox
          args={[w * 0.86, board.stripHeight, d * 0.86]}
          radius={Math.min(board.tileRadius, board.stripHeight / 2)}
          smoothness={board.tileSmoothness}
          position={[0, top + board.stripHeight / 2 - 0.005, 0]}
          receiveShadow
        >
          <Mat color={topColor(def.kind, colors)} />
        </RoundedBox>
      )}

      {groupColor && (
        <RoundedBox
          args={[w, board.stripHeight, stripDepth]}
          radius={Math.min(board.tileRadius, board.stripHeight / 2)}
          smoothness={board.tileSmoothness}
          position={[0, top + board.stripHeight / 2 - 0.005, -d / 2 + stripDepth / 2]}
          receiveShadow
        >
          <Mat color={groupColor} />
        </RoundedBox>
      )}

      {/* Tấm màu chủ sở hữu, phủ phần ô không có dải màu nhóm */}
      {building && (
        <group position={[0, top, contentZ]}>
          <Pop animate={mounted}>
            <RoundedBox
              args={[w * 0.9, board.stripHeight, (groupColor ? d - stripDepth : d) * 0.86]}
              radius={Math.min(board.tileRadius, board.stripHeight / 2)}
              smoothness={board.tileSmoothness}
              position={[0, board.stripHeight / 2, 0]}
              receiveShadow
            >
              <Mat color={building.color} />
            </RoundedBox>
          </Pop>
        </group>
      )}

      <PickGlow state={pick} tone={pickTone} w={w} d={d} y={top + board.stripHeight} />

      <group position={[0, top + board.stripHeight, contentZ]}>
        <group scale={props.scale}>
          <TileProps kind={def.kind} />
        </group>
        <BuildingSet level={building?.level ?? 0} color={building?.color ?? colors.tile} width={w} />
      </group>
    </group>
  )
}
