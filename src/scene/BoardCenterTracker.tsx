/**
 * Ghi toạ độ màn hình của tâm bàn cờ vào uiStore mỗi khi camera đổi (zoom, kéo, đổi khung hình),
 * để HUD đặt nút "Tung xúc xắc" ngay dưới xúc xắc. Không vẽ gì.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { centerTopY } from './boardLayout'

export function BoardCenterTracker() {
  const { board } = useVisual()
  const size = useThree((s) => s.size)
  const point = useRef(new Vector3())

  useFrame(({ camera }) => {
    const p = point.current.set(0, centerTopY(board), 0).project(camera)
    const x = ((p.x + 1) / 2) * size.width
    const y = ((1 - p.y) / 2) * size.height
    const prev = useUiStore.getState().boardCenter
    if (!prev || Math.abs(prev.x - x) > 0.5 || Math.abs(prev.y - y) > 0.5) useUiStore.setState({ boardCenter: { x, y } })
  })
  return null
}
