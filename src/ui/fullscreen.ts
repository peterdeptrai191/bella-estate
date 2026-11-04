/** Toàn màn hình: Fullscreen API (kèm tiền tố webkit cho Safari iPad). iPhone không hỗ trợ cho trang web. */
interface FsDocument {
  fullscreenElement?: Element | null
  webkitFullscreenElement?: Element | null
  exitFullscreen?: () => Promise<void>
  webkitExitFullscreen?: () => void
}
interface FsElement {
  requestFullscreen?: (options?: FullscreenOptions) => Promise<void>
  webkitRequestFullscreen?: () => void
}

export function fullscreenSupported(): boolean {
  const el = document.documentElement as unknown as FsElement
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'
}

export function isFullscreen(): boolean {
  const doc = document as unknown as FsDocument
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement)
}

/** Đang chạy như app đã thêm vào màn hình chính (đã tràn màn hình sẵn). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
}

export async function toggleFullscreen(): Promise<void> {
  const doc = document as unknown as FsDocument
  const el = document.documentElement as unknown as FsElement
  try {
    if (isFullscreen()) {
      if (doc.exitFullscreen) await doc.exitFullscreen()
      else doc.webkitExitFullscreen?.()
      return
    }
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else el.webkitRequestFullscreen?.()
    // Khoá màn hình ngang nếu trình duyệt cho phép (Android Chrome).
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    await orientation.lock?.('landscape').catch(() => undefined)
  } catch {
    // Trình duyệt từ chối: bỏ qua.
  }
}
