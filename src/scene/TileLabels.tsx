import { Text } from '@react-three/drei'
import { useMemo, type ReactNode } from 'react'
import { BOARD } from '../config/board'
import { formatMoney, rentFor } from '../game-core'
import { useAnimationStore } from '../store/animationStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout, localToBoard, type TileTransform } from './boardLayout'

/**
 * Chữ in phẳng trên mặt ô, xoay để luôn đọc xuôi từ góc camera (ô ở hai cạnh xa camera thì lật 180°).
 * Ô mua được (thành phố, Khu Du Lịch) theo kiểu Business Tour: tên IN HOA trên dải màu phía trong,
 * số tiền to ở phần phía ngoài — giá mua khi chưa có chủ, tiền thuê hiện tại (chữ trắng viền màu chủ) khi đã có chủ.
 * Ô đặc biệt chỉ có tên. Chữ vẽ đè lên nhà/Landmark nên không bị che.
 */
/** Mọi ký tự có thể in trên ô: tạo sẵn cả bộ trong atlas một lần, tránh atlas phải nới rộng giữa chừng (máy yếu có thể mất chữ). */
const CHARACTERS = [...new Set(BOARD.map((t) => t.name + t.name.toUpperCase()).join('') + '0123456789.,K ')].join('')

export function TileLabels() {
  const { board, tileText, camera, playerColors } = useVisual()
  const layout = useMemo(() => computeTileLayout(board), [board])
  const view = useAnimationStore((s) => s.view)
  if (!tileText.enabled) return null
  const az = (camera.azimuthDeg * Math.PI) / 180
  // Hướng "lên trên màn hình" khi nhìn xuống mặt bàn = hướng ra xa camera.
  const up: [number, number] = [-Math.sin(az), -Math.cos(az)]
  const y = board.tileHeight + board.stripHeight + 0.004

  /** Một dòng chữ phẳng đặt tại toạ độ cục bộ `localZ` của ô. */
  const label = (
    t: TileTransform,
    key: string,
    localZ: number,
    text: string,
    style: { size: number; color: string; outline: string; outlineWidth: number; maxWidth: number },
  ): ReactNode => {
    const s = Math.sin(t.rotationY)
    const c = Math.cos(t.rotationY)
    // Chiều "lên" của chữ mặc định là -z cục bộ của ô (hướng vào trong bàn cờ).
    const flip = -s * up[0] + -c * up[1] < 0
    const [x, z] = localToBoard(t, 0, localZ)
    return (
      <group key={key} position={[x, y, z]} rotation-y={t.rotationY + (flip ? Math.PI : 0)}>
        <Text
          font={tileText.font}
          fontSize={style.size}
          color={style.color}
          outlineColor={style.outline}
          outlineWidth={`${style.outlineWidth * 100}%`}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          maxWidth={style.maxWidth}
          lineHeight={tileText.lineHeight}
          rotation-x={-Math.PI / 2}
          scale={[1, tileText.stretch, 1]}
          raycast={() => null}
          renderOrder={tileText.renderOrder}
          sdfGlyphSize={tileText.sdfGlyphSize}
          characters={CHARACTERS}
        >
          {text}
          <meshBasicMaterial depthTest={!tileText.alwaysOnTop} depthWrite={false} transparent toneMapped={false} />
        </Text>
      </group>
    )
  }

  return (
    <group>
      {layout.map((t) => {
        const depth = t.depth - board.tileGap
        const width = t.width - board.tileGap
        const i = t.def.index
        if (t.def.price === null) {
          return label(t, `n${i}`, depth / 2 - depth * (t.isCorner ? tileText.cornerEdgeInset : tileText.edgeInset), t.def.name, {
            size: t.isCorner ? tileText.cornerFontSize : tileText.fontSize,
            color: tileText.color,
            outline: tileText.outlineColor,
            outlineWidth: tileText.outlineWidth,
            maxWidth: width * 0.94,
          })
        }
        const tile = view?.tiles[i]
        const owner = tile?.owner ? view?.players.find((p) => p.id === tile.owner) : undefined
        const amount = view && owner ? rentFor(view, i) : t.def.price
        const stripDepth = depth * board.stripRatio
        return (
          <group key={`c${i}`}>
            {label(t, 'name', -depth / 2 + stripDepth / 2, t.def.name.toUpperCase(), {
              size: tileText.nameFontSize,
              color: tileText.nameColor,
              outline: tileText.nameOutlineColor,
              outlineWidth: tileText.nameOutlineWidth,
              maxWidth: width * 0.92,
            })}
            {label(t, 'price', depth / 2 - depth * tileText.priceInset, formatMoney(amount), {
              size: tileText.priceFontSize,
              // Ô có chủ đã tô màu chủ, nên số tiền đổi sang chữ trắng viền màu chủ đậm.
              color: owner ? tileText.ownedPriceColor : tileText.color,
              outline: owner ? playerColors[owner.seat % playerColors.length] : tileText.outlineColor,
              outlineWidth: tileText.priceOutlineWidth,
              maxWidth: width * 0.98,
            })}
          </group>
        )
      })}
    </group>
  )
}
