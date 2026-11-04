/**
 * Góc nhìn do người chơi điều khiển: phóng to (zoom) và kéo bàn cờ (pan).
 * Trạng thái có thể đổi (giống scene/cameraControl), để ở store vì cả scene lẫn nút "Toàn cảnh" của UI dùng: CameraRig đọc mỗi khung hình, ViewGestures ghi khi chạm/cuộn.
 * `pan` là độ dời tâm nhìn theo trục phải/lên của màn hình (đơn vị thế giới).
 */
import { useUiStore } from './uiStore'

const view = { zoom: 1, panRight: 0, panUp: 0, dragged: false }

export function getUserView(): Readonly<typeof view> {
  return view
}

function publish(): void {
  const zoomed = view.zoom > 1.01 || Math.abs(view.panRight) > 0.01 || Math.abs(view.panUp) > 0.01
  if (useUiStore.getState().viewZoomed !== zoomed) useUiStore.setState({ viewZoomed: zoomed })
}

/** Đặt zoom + pan mới (đã giới hạn) — gọi từ ViewGestures. */
export function setUserView(zoom: number, panRight: number, panUp: number, limits: { maxZoom: number; maxPan: number }): void {
  view.zoom = Math.min(limits.maxZoom, Math.max(1, zoom))
  // Càng phóng to càng được kéo xa; ở mức 1 thì bàn cờ nằm giữa.
  const reach = limits.maxPan * (1 - 1 / view.zoom)
  const len = Math.hypot(panRight, panUp)
  const k = len > reach ? reach / len : 1
  view.panRight = panRight * k
  view.panUp = panUp * k
  publish()
}

/** Về toàn cảnh bàn cờ. */
export function resetUserView(): void {
  view.zoom = 1
  view.panRight = 0
  view.panUp = 0
  publish()
}

/** Ngón tay/chuột vừa kéo bàn cờ: cú bấm kết thúc thao tác kéo không tính là bấm vào ô. */
export function markDragged(value: boolean): void {
  view.dragged = value
}

export function wasDragged(): boolean {
  return view.dragged
}
