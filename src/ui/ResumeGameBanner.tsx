/** Đã đăng nhập và còn ván online chơi dở: hiện nút vào lại (ở mọi màn hình menu). */
import { useAuthStore } from '../store/authStore'
import { joinRoom } from '../store/net'
import { useOnlineStore } from '../store/onlineStore'
import { displayName, useProfileStore } from '../store/profileStore'

export function ResumeGameBanner() {
  const activeRoom = useAuthStore((s) => s.activeRoom)
  const account = useAuthStore((s) => s.account)
  const status = useOnlineStore((s) => s.status)
  const { name, skin } = useProfileStore()
  if (!account || !activeRoom || (status !== 'idle' && status !== 'error')) return null
  return (
    <div className="pointer-events-auto absolute bottom-[1.2rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-[0.8rem] rounded-2xl bg-cream px-[1rem] py-[0.6rem] whitespace-nowrap shadow-xl ring-[0.18rem] ring-emerald-400">
      <span className="text-[1.6rem] leading-none">🎲</span>
      <span className="flex flex-col leading-tight">
        <b className="text-[1.1rem] text-ink">Bạn đang có ván chơi dở</b>
        <span className="text-[0.9rem] text-stone-500">Phòng {activeRoom}</span>
      </span>
      <button className="btn-3d btn-green px-[1.1rem] py-[0.4rem] text-[1.1rem]" onClick={() => void joinRoom(activeRoom, { name: displayName(name), skin })}>
        Vào lại
      </button>
      <button
        aria-label="Ẩn"
        className="text-[1.2rem] font-bold text-stone-400 hover:text-stone-600"
        onClick={() => useAuthStore.setState({ activeRoom: null })}
      >
        ×
      </button>
    </div>
  )
}
