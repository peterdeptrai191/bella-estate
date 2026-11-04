import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { useVisual } from '../store/visualStore'
import { computeTileLayout, localToBoard } from './boardLayout'

/**
 * Tên ô in phẳng trên mặt bàn cờ, sát mép ngoài. Chữ được xoay sao cho luôn đọc xuôi từ góc camera
 * (ô ở hai cạnh xa camera thì lật 180°).
 */
export function TileLabels() {
  const { board, tileText, camera } = useVisual()
  const layout = useMemo(() => computeTileLayout(board), [board])
  if (!tileText.enabled) return null
  const az = (camera.azimuthDeg * Math.PI) / 180
  // Hướng "lên trên màn hình" khi nhìn xuống mặt bàn = hướng ra xa camera.
  const up: [number, number] = [-Math.sin(az), -Math.cos(az)]
  const y = board.tileHeight + board.stripHeight + 0.004

  return (
    <group>
      {layout.map((t) => {
        const depth = t.depth - board.tileGap
        const width = t.width - board.tileGap
        const s = Math.sin(t.rotationY)
        const c = Math.cos(t.rotationY)
        // Chiều "lên" của chữ mặc định là -z cục bộ của ô (hướng vào trong bàn cờ).
        const flip = -s * up[0] + -c * up[1] < 0
        const [x, z] = localToBoard(t, 0, depth / 2 - depth * tileText.edgeInset)
        return (
          <group key={t.def.index} position={[x, y, z]} rotation-y={t.rotationY + (flip ? Math.PI : 0)}>
            <Text
              font={tileText.font}
              fontSize={t.isCorner ? tileText.cornerFontSize : tileText.fontSize}
              color={tileText.color}
              anchorX="center"
              anchorY="middle"
              textAlign="center"
              maxWidth={width * 0.92}
              lineHeight={1}
              rotation-x={-Math.PI / 2}
              raycast={() => null}
            >
              {t.def.name}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
