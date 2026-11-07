/**
 * Chơi online: mất kết nối quá lâu thì bot chơi thay. Khi người chơi quay lại, hiện bảng nhỏ để tắt bot và chơi tiếp.
 */
import { resumeControl } from '../../store/net'
import { useBotTakeover } from '../useBotTakeover'

export function BotTakeoverBanner() {
  const takeover = useBotTakeover()
  if (!takeover) return null
  return (
    <div className="pointer-events-auto absolute bottom-[4.2rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-[0.8rem] rounded-2xl bg-cream px-[1rem] py-[0.6rem] whitespace-nowrap shadow-xl ring-[0.18rem] ring-violet-400 portrait:bottom-[7rem]">
      <span className="text-[1.6rem] leading-none">🤖</span>
      <span className="flex flex-col leading-tight">
        <b className="text-[1.1rem] text-ink">Bot đang chơi thay bạn</b>
        <span className="text-[0.9rem] text-stone-500">Bạn đã mất kết nối một lúc</span>
      </span>
      <button className="btn-3d btn-green px-[1.1rem] py-[0.4rem] text-[1.1rem]" onClick={resumeControl}>
        Tắt bot, chơi tiếp
      </button>
    </div>
  )
}
