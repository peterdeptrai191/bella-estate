/** Nút toàn màn hình. iPhone không cho trang web vào toàn màn hình nên hiện hướng dẫn "Thêm vào MH chính". */
import { useEffect, useState } from 'react'
import { Modal } from './kit'
import { fullscreenSupported, isFullscreen, isStandalone, toggleFullscreen } from './fullscreen'

export function FullscreenButton({ size = 'h-[2.2rem] w-[2.2rem] text-[1.1rem]' }: { size?: string }) {
  const [active, setActive] = useState(false)
  const [tip, setTip] = useState(false)

  useEffect(() => {
    const sync = () => setActive(isFullscreen())
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  if (isStandalone()) return null
  return (
    <>
      <button
        aria-label={active ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        className={`btn-3d btn-blue pointer-events-auto flex items-center justify-center ${size}`}
        onClick={() => (fullscreenSupported() ? void toggleFullscreen() : setTip(true))}
      >
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
          ) : (
            <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
          )}
        </svg>
      </button>
      {tip && (
        <Modal title="Chơi toàn màn hình" onClose={() => setTip(false)} className="w-[28rem]" layer="z-50">
          <div className="space-y-[0.5rem] text-[1.05rem] text-stone-600">
            <p>Safari trên iPhone không cho trang web tự mở toàn màn hình. Thêm game vào màn hình chính để chơi tràn màn hình như một app:</p>
            <p>
              1. Bấm nút <b>Chia sẻ</b> <span className="inline-block rounded bg-sky-100 px-[0.3rem]">⬆️</span> trên thanh Safari.
            </p>
            <p>
              2. Chọn <b>Thêm vào MH chính</b> (Add to Home Screen).
            </p>
            <p>3. Mở Bella Estate từ biểu tượng mới trên màn hình chính.</p>
          </div>
          <div className="mt-[0.9rem] flex justify-center">
            <button className="btn-3d btn-blue px-[2rem] py-[0.4rem] text-[1.1rem]" onClick={() => setTip(false)}>
              Đã hiểu
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
