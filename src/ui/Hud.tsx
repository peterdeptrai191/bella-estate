/**
 * Giao diện chơi thử TẠM THỜI: 4 khung người chơi ở 4 góc, dòng mô tả event đang phát,
 * nút Lượt tiếp / Tự chơi. Người chơi chọn ngẫu nhiên (chưa có bot AI, chưa có popup mua/xây).
 * Tiền và lượt hiển thị lấy từ view (đi cùng animation), không lấy thẳng từ game-core.
 */
import { useCallback, useEffect, useState } from 'react'
import { setMuted, unlockAudio } from '../audio/soundPlayer'
import { VISUAL } from '../config/visual'
import { describeEvent, formatMoney } from '../game-core'
import { useAnimationStore, useIsAnimating } from '../store/animationStore'
import { useGameStore } from '../store/gameStore'
import { playOneTurn, startNewGame } from './playtest'

const CORNERS = ['left-3 top-3', 'right-3 top-3', 'right-3 bottom-20', 'left-3 bottom-20']

export function Hud() {
  const view = useAnimationStore((s) => s.view)
  const head = useAnimationStore((s) => s.queue[0])
  const queued = useAnimationStore((s) => s.queue.length)
  const game = useGameStore((s) => s.game)
  const animating = useIsAnimating()
  const [auto, setAuto] = useState(false)
  const [muted, setMutedState] = useState(false)
  const nextTurn = useCallback(() => {
    unlockAudio()
    playOneTurn()
  }, [])

  // Tự chơi: chỉ giãn nhịp ở phía UI — đợi hàng đợi animation trống rồi mới chơi lượt kế.
  useEffect(() => {
    if (!auto || animating || game?.phase !== 'playing') return
    const timer = setTimeout(playOneTurn, 350)
    return () => clearTimeout(timer)
  }, [auto, animating, game])

  if (!view || !game) return null
  const caption = head ? describeEvent(head.event, game) : null
  const winner = view.winner ? view.players.find((p) => p.id === view.winner) : null

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-sm">
      {view.players.map((p) => {
        const color = VISUAL.playerColors[p.seat % VISUAL.playerColors.length]
        const active = p.id === view.currentPlayerId && !view.winner
        return (
          <div
            key={p.id}
            className={`absolute ${CORNERS[p.seat]} flex min-w-32 items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-md transition ${
              active ? 'scale-105 ring-4' : ''
            } ${p.bankrupt ? 'opacity-40 grayscale' : ''}`}
            style={{ ['--tw-ring-color' as string]: color }}
          >
            <span className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow" style={{ background: color }} />
            <span className="leading-tight">
              <span className="block font-semibold text-stone-700">{p.name}</span>
              <span className="block font-bold tabular-nums text-amber-600">
                {p.bankrupt ? 'Phá sản' : formatMoney(p.money)}
              </span>
            </span>
          </div>
        )
      })}

      {caption && (
        <div className="absolute left-1/2 top-20 max-w-[80%] -translate-x-1/2 rounded-full bg-stone-800/75 px-4 py-1.5 text-center text-white sm:top-4">
          {caption}
        </div>
      )}

      {winner && (
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-3xl bg-white px-6 py-4 text-center shadow-xl">
          <div className="text-2xl">🏆</div>
          <div className="text-lg font-bold text-stone-800">{winner.name} thắng!</div>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 whitespace-nowrap sm:gap-2">
        <button
          className="rounded-full bg-rose-500 px-4 py-2.5 sm:px-5 font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
          onClick={nextTurn}
          disabled={game.phase !== 'playing' || auto}
        >
          🎲 Lượt tiếp
        </button>
        <button
          className={`rounded-full px-3 py-2.5 font-semibold sm:px-4 shadow-lg active:scale-95 ${auto ? 'bg-stone-800 text-white' : 'bg-white text-stone-700'}`}
          onClick={() => {
            unlockAudio()
            setAuto((v) => !v)
          }}
        >
          {auto ? '⏸ Dừng' : '▶ Tự chơi'}
        </button>
        <button
          className="rounded-full bg-white px-3 py-2.5 font-semibold text-stone-700 sm:px-4 shadow-lg active:scale-95"
          onClick={() => {
            setAuto(false)
            startNewGame()
          }}
        >
          Ván mới
        </button>
        <button
          className="rounded-full bg-white px-3 py-2.5 shadow-lg active:scale-95"
          aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          onClick={() => {
            unlockAudio()
            setMuted(!muted)
            setMutedState(!muted)
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {queued > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-stone-500">
          còn {queued - 1} event chờ phát
        </div>
      )}
    </div>
  )
}
