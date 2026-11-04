/**
 * Cử chỉ điều khiển góc nhìn trên canvas:
 * - Điện thoại: chụm/mở 2 ngón để zoom, kéo 1 ngón để di chuyển khi đã zoom.
 * - Máy tính: lăn chuột để zoom (về phía con trỏ), kéo chuột để di chuyển khi đã zoom.
 * Khi chưa zoom, vuốt dọc vẫn để trình duyệt cuộn trang (Safari thu gọn thanh địa chỉ).
 */
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { boardLength } from './boardLayout'
import { getUserView, markDragged, resetUserView, setUserView } from '../store/viewControl'

export function ViewGestures() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const visual = useVisual()
  const zoomed = useUiStore((s) => s.viewZoomed)

  const el = gl.domElement
  // Vào trận mới: bắt đầu từ toàn cảnh.
  useEffect(() => resetUserView(), [])

  useEffect(() => {
    el.style.setProperty('touch-action', zoomed ? 'none' : 'pan-y')
  }, [el, zoomed])

  useEffect(() => {
    const { camera: cfg, board } = visual
    const limits = { maxZoom: cfg.userZoomMax, maxPan: boardLength(board) / 2 + board.baseMargin }
    const pointers = new Map<number, { x: number; y: number }>()
    let start = { x: 0, y: 0 }
    let lastPinch = 0

    /** Zoom quanh một điểm trên màn hình (px tính từ tâm canvas): điểm đó đứng yên. */
    const zoomAround = (factor: number, sx: number, sy: number) => {
      const v = getUserView()
      const before = camera.zoom
      const next = Math.min(cfg.userZoomMax, Math.max(1, v.zoom * factor))
      const after = before * (next / v.zoom)
      const shift = 1 / before - 1 / after
      setUserView(next, v.panRight + sx * shift, v.panUp - sy * shift, limits)
    }
    const panBy = (dx: number, dy: number) => {
      const v = getUserView()
      setUserView(v.zoom, v.panRight - dx / camera.zoom, v.panUp + dy / camera.zoom, limits)
    }
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }
    }
    const pinchInfo = () => {
      const [a, b] = [...pointers.values()]
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
    }

    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, local(e))
      if (pointers.size === 1) {
        start = local(e)
        markDragged(false)
      }
      if (pointers.size === 2) lastPinch = pinchInfo().dist
    }
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      const p = local(e)
      if (pointers.size >= 2) {
        const before = pinchInfo()
        pointers.set(e.pointerId, p)
        const after = pinchInfo()
        if (lastPinch > 0) zoomAround(after.dist / lastPinch, after.mid.x, after.mid.y)
        panBy(after.mid.x - before.mid.x, after.mid.y - before.mid.y)
        lastPinch = after.dist
        markDragged(true)
        return
      }
      pointers.set(e.pointerId, p)
      if (Math.hypot(p.x - start.x, p.y - start.y) > cfg.dragThreshold) markDragged(true)
      // Chỉ kéo bàn cờ khi đã zoom (chưa zoom thì để trình duyệt cuộn trang).
      if (getUserView().zoom > 1.01 && (e.pointerType !== 'mouse' || e.buttons & 1)) panBy(p.x - prev.x, p.y - prev.y)
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      lastPinch = pointers.size === 2 ? pinchInfo().dist : 0
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      zoomAround(Math.exp(-e.deltaY * cfg.wheelZoomSpeed), p.x, p.y)
    }
    // Safari iPhone: chặn cử chỉ phóng to cả trang khi chụm ngón trên bàn cờ.
    const onGesture = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGesture)
    el.addEventListener('gesturechange', onGesture)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGesture)
      el.removeEventListener('gesturechange', onGesture)
    }
  }, [el, camera, visual])

  return null
}
