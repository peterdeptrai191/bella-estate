import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { useAnimationStore } from '../store/animationStore'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout, localToBoard } from './boardLayout'

/**
 * Nhãn nổi trên ô trong chế độ chọn ô (vd. giá bán khi thiếu tiền).
 * Tiền thuê / giá mua thường ngày đã in thẳng trên mặt ô (TileLabels).
 */
export function TileTags() {
  const visual = useVisual()
  const { board, tags } = visual
  const view = useAnimationStore((s) => s.view)
  const pickLabels = useUiStore((s) => s.pick?.labels)
  const layout = useMemo(() => computeTileLayout(board), [board])
  if (!tags.enabled || !view) return null

  return (
    <group>
      {layout.map((t) => {
        const i = t.def.index
        const pickLabel = pickLabels?.[i]
        if (!pickLabel) return null
        const color = '#f2437a'
        const text = pickLabel
        // Đặt nhãn ở phía trong ô (chỗ dải màu nhóm), tránh đè lên nhà.
        const depth = t.depth - board.tileGap
        const [x, z] = localToBoard(t, 0, -depth / 2 + depth * board.stripRatio * 0.5)
        return (
          <Html
            key={i}
            position={[x, board.tileHeight + board.stripHeight + tags.height, z]}
            center
            zIndexRange={[5, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="rounded-full border-2 border-white px-[0.45em] text-[0.85rem] leading-[1.35em] font-extrabold whitespace-nowrap text-white shadow-md"
              style={{ background: color, textShadow: '0 1px 0 rgb(0 0 0 / 0.25)' }}
            >
              {text}
            </div>
          </Html>
        )
      })}
    </group>
  )
}
