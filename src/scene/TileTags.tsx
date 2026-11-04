import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { formatMoney, rentFor } from '../game-core'
import { useAnimationStore } from '../store/animationStore'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout, localToBoard } from './boardLayout'

/** Rút gọn số tiền cho nhãn nhỏ: 1250 → 1,3K. */
function shortMoney(amount: number): string {
  if (amount >= 10_000) return `${Math.round(amount / 1000)}K`
  if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace('.', ',')}K`
  return formatMoney(amount)
}

/**
 * Nhãn trên ô: tiền thuê hiện tại của các ô có chủ (màu người sở hữu, tính bằng game-core trên view),
 * hoặc nhãn riêng của chế độ chọn ô (vd. giá bán khi thiếu tiền).
 */
export function TileTags() {
  const visual = useVisual()
  const { board, tags, playerColors } = visual
  const view = useAnimationStore((s) => s.view)
  const pickLabels = useUiStore((s) => s.pick?.labels)
  const layout = useMemo(() => computeTileLayout(board), [board])
  if (!tags.enabled || !view) return null

  return (
    <group>
      {layout.map((t) => {
        const i = t.def.index
        const tile = view.tiles[i]
        const pickLabel = pickLabels?.[i]
        if (!pickLabel && !tile.owner) return null
        const seat = view.players.find((p) => p.id === tile.owner)?.seat ?? 0
        const color = pickLabel ? '#f2437a' : playerColors[seat % playerColors.length]
        const text = pickLabel ?? shortMoney(rentFor(view, i))
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
