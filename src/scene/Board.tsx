import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import { useAnimationStore } from '../store/animationStore'
import { useVisual } from '../store/visualStore'
import { boardLength, computeTileLayout } from './boardLayout'
import { Mat } from './Mat'
import { Tile, type TileBuilding } from './Tile'

/** Bàn cờ tĩnh: đế, bãi cỏ ở giữa (để trống cho xúc xắc/logo), 32 ô và nhà mẫu. */
export function Board() {
  const visual = useVisual()
  const { board, colors, preview, playerColors } = visual
  const layout = useMemo(() => computeTileLayout(board), [board])
  const length = boardLength(board)
  const baseSize = length + 2 * board.baseMargin
  const topLayer = Math.min(0.12, board.baseThickness / 2)
  const centerSize = length - 2 * board.cornerSize - 2 * board.centerInset
  const centerHeight = Math.max(0.02, board.tileHeight - board.centerDrop)

  // Có ván đang chơi: lấy chủ sở hữu và công trình từ view. Chưa có: hiện nhà mẫu trong visual.ts.
  const view = useAnimationStore((s) => s.view)
  const buildings = new Map<number, TileBuilding>()
  if (view) {
    view.tiles.forEach((t, i) => {
      if (!t.owner) return
      const seat = view.players.find((p) => p.id === t.owner)?.seat ?? 0
      buildings.set(i, { level: t.level, color: playerColors[seat % playerColors.length] })
    })
  } else if (preview.showBuildings) {
    for (const b of preview.buildings) {
      buildings.set(b.tile, { level: b.level, color: playerColors[(b.player - 1) % playerColors.length] })
    }
  }

  return (
    <group>
      {/* Đế: lớp mặt sáng + thân sẫm */}
      <RoundedBox
        args={[baseSize, topLayer, baseSize]}
        radius={Math.min(board.baseRadius, topLayer / 2)}
        smoothness={board.tileSmoothness}
        position={[0, -topLayer / 2, 0]}
        receiveShadow
        castShadow
      >
        <Mat color={colors.base} />
      </RoundedBox>
      <RoundedBox
        args={[baseSize, board.baseThickness - topLayer, baseSize]}
        radius={Math.min(board.baseRadius, (board.baseThickness - topLayer) / 2)}
        smoothness={board.tileSmoothness}
        position={[0, -topLayer - (board.baseThickness - topLayer) / 2, 0]}
        castShadow
      >
        <Mat color={colors.baseSide} />
      </RoundedBox>

      {/* Bãi cỏ ở giữa */}
      {centerSize > 0 && (
        <RoundedBox
          args={[centerSize, centerHeight, centerSize]}
          radius={Math.min(board.tileRadius * 2, centerHeight / 2)}
          smoothness={board.tileSmoothness}
          position={[0, centerHeight / 2, 0]}
          receiveShadow
        >
          <Mat color={colors.center} />
        </RoundedBox>
      )}

      {layout.map((t) => (
        <Tile key={t.def.index} layout={t} building={buildings.get(t.def.index)} />
      ))}

      {/* Sàn trong suốt chỉ hứng bóng của bàn cờ */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -board.baseThickness - 0.002, 0]} receiveShadow>
        <planeGeometry args={[baseSize * 4, baseSize * 4]} />
        <shadowMaterial opacity={colors.shadowFloorOpacity} transparent />
      </mesh>
    </group>
  )
}
