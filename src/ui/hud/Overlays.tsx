/** Chữ lớn giữa màn hình, thanh trên cùng, màn hình kết quả, nhắc xoay ngang. */
import { useEffect, useMemo, useState } from 'react'
import { FullscreenButton } from '../FullscreenButton'
import { resetUserView } from '../../store/viewControl'
import { setMuted, unlockAudio } from '../../audio/soundPlayer'
import { ECONOMY } from '../../config/economy'
import { SEAT_SKINS, skinById } from '../../config/skins'
import { describeEvent, standings, type WinReason } from '../../game-core'
import { useAnimationStore } from '../../store/animationStore'
import { useGameStore } from '../../store/gameStore'
import { useProfileStore } from '../../store/profileStore'
import { useUiStore } from '../../store/uiStore'
import { useVisual } from '../../store/visualStore'
import { Avatar, Modal, Money } from '../kit'
import { exitToMenu } from '../matchSetup'

export function Banners() {
  const banners = useUiStore((s) => s.banners)
  const latest = banners[banners.length - 1]
  if (!latest) return null
  if (latest.tone === 'double') {
    return (
      <div key={latest.id} className="pointer-events-none absolute top-[38%] left-1/2 z-20 -translate-x-1/2">
        <div className="animate-banner-in rounded-[2.5rem] bg-white px-[2rem] py-[0.4rem] text-[3.4rem] font-extrabold text-[#f2437a] shadow-xl [-webkit-text-stroke:0.06em_#fff]">
          {latest.text}
        </div>
      </div>
    )
  }
  const color = latest.tone === 'bad' ? 'text-rose-100' : latest.tone === 'good' ? 'text-amber-200' : 'text-white'
  return (
    <div key={latest.id} className="pointer-events-none absolute inset-x-0 top-[40%] z-20 flex justify-center">
      <div
        className={`animate-pop-in w-full bg-[#1d3b5a]/55 py-[0.7rem] text-center text-[2rem] font-extrabold tracking-wide uppercase ${color}`}
        style={{ textShadow: '0 0.08em 0 rgb(0 0 0 / 0.35)' }}
      >
        {latest.text}
      </div>
    </div>
  )
}

export function TopBar() {
  const game = useGameStore((s) => s.game)
  const head = useAnimationStore((s) => s.queue[0])
  const autoplay = useUiStore((s) => s.autoplayHuman)
  const [muted, setMutedState] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const zoomed = useUiStore((s) => s.viewZoomed)
  const mode = useGameStore((s) => s.mode)
  if (!game) return null
  const caption = head ? describeEvent(head.event, game) : null
  return (
    <div className="pointer-events-none absolute top-[0.8rem] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[0.4rem]">
      <div className="pointer-events-auto flex items-center gap-[0.5rem]">
        <button
          aria-label="Thoát ván"
          className="btn-3d btn-pink flex h-[2.2rem] items-center justify-center px-[0.8rem] text-[0.95rem]"
          onClick={() => setConfirmExit(true)}
        >
          Thoát
        </button>
        <span className="rounded-full bg-ink/80 px-[1rem] py-[0.15rem] text-[1.15rem] font-extrabold whitespace-nowrap text-white shadow-md tabular-nums">
          Vòng {Math.min(game.round, ECONOMY.maxRounds)}/{ECONOMY.maxRounds}
        </span>
        <button
          aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="btn-3d btn-blue flex h-[2.2rem] w-[2.2rem] items-center justify-center text-[1.1rem]"
          onClick={() => {
            unlockAudio()
            setMuted(!muted)
            setMutedState(!muted)
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <FullscreenButton />
        {zoomed && (
          <button
            aria-label="Xem toàn cảnh bàn cờ"
            className="btn-3d btn-yellow flex h-[2.2rem] items-center justify-center px-[0.8rem] text-[0.95rem] whitespace-nowrap"
            onClick={resetUserView}
          >
            Toàn cảnh
          </button>
        )}
        {import.meta.env.DEV && (
          <button
            className={`btn-3d px-[0.8rem] py-[0.1rem] text-[0.85rem] ${autoplay ? 'btn-pink' : 'btn-gray'}`}
            onClick={() => useUiStore.getState().setAutoplayHuman(!autoplay)}
            title="Dev: để bot chơi thay bạn"
          >
            {autoplay ? 'Bot đang chơi thay' : 'Bot chơi thay'}
          </button>
        )}
      </div>
      {confirmExit && (
        <Modal title="Thoát ván?" ribbon="#f2437a" onClose={() => setConfirmExit(false)} className="w-[24rem]" layer="z-50">
          <p className="text-center text-[1.1rem] text-stone-600">
            {mode === 'online' ? 'Bạn sẽ rời phòng; bot sẽ chơi thay ghế của bạn.' : 'Ván đang chơi sẽ không được lưu.'}
          </p>
          <div className="mt-[0.9rem] flex justify-center gap-[0.8rem]">
            <button className="btn-3d btn-gray px-[1.4rem] py-[0.4rem] text-[1.1rem]" onClick={() => setConfirmExit(false)}>
              Ở lại
            </button>
            <button className="btn-3d btn-pink px-[1.4rem] py-[0.4rem] text-[1.1rem]" onClick={() => void exitToMenu()}>
              Về Menu
            </button>
          </div>
        </Modal>
      )}
      {caption && (
        <div className="max-w-[46rem] truncate rounded-full bg-white/80 px-[1rem] py-[0.1rem] text-[0.95rem] font-semibold text-stone-600 shadow">
          {caption}
        </div>
      )}
    </div>
  )
}

const WIN_TEXT: Record<WinReason, string> = {
  LAST_SURVIVOR: 'Người trụ lại cuối cùng',
  THREE_COLOR_GROUPS: 'Độc quyền 3 nhóm màu',
  SIDE_MONOPOLY: 'Độc quyền một cạnh bàn cờ',
  ALL_RESORTS: 'Độc quyền 4 Khu Du Lịch',
  ROUND_LIMIT: 'Tài sản cao nhất khi hết vòng',
}

export function ResultModal({ onRestart, onMenu }: { onRestart: () => void; onMenu: () => void }) {
  const view = useAnimationStore((s) => s.view)
  const game = useGameStore((s) => s.game)
  const humanId = useGameStore((s) => s.humanId)
  const { playerColors } = useVisual()
  const seats = useGameStore((s) => s.seats)
  const rows = useMemo(() => {
    if (!game || game.phase !== 'finished') return []
    // Người thắng luôn đứng đầu (thắng sớm không nhất thiết là người giàu nhất).
    return [...standings(game)].sort((a, b) => Number(b.playerId === game.winner) - Number(a.playerId === game.winner))
  }, [game])
  const matchId = useGameStore((s) => s.matchId)
  const finished = Boolean(view?.winner) && game?.phase === 'finished'
  const won = finished && view?.winner === humanId
  const [earned, setEarned] = useState(0)
  // Thưởng Vàng sau trận (GDD mục 9) — mỗi ván một lần.
  useEffect(() => {
    if (!finished || !humanId) return
    const amount = useProfileStore.getState().reward(matchId, won)
    // oxlint-disable-next-line react/set-state-in-effect -- ghi ví (hệ thống ngoài) rồi hiện số Vàng vừa nhận
    if (amount > 0) setEarned(amount)
  }, [finished, humanId, matchId, won])
  if (!finished || !view?.winner || !game) return null
  return (
    <Modal title={won ? 'Chiến thắng!' : 'Thất bại'} ribbon={won ? '#57c04a' : '#2fa7e6'} className="w-[30rem]" layer="z-50">
      <div className="mb-[0.6rem] text-center text-[1.15rem] font-bold text-stone-500">{game.winReason && WIN_TEXT[game.winReason]}</div>
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="grid grid-cols-[2rem_1fr_auto] bg-[#57c04a] px-[0.8rem] py-[0.2rem] text-[0.95rem] font-bold text-white">
          <span>#</span>
          <span>Người chơi</span>
          <span>Tổng tài sản</span>
        </div>
        {rows.map((row, k) => {
          const seat = game.players.findIndex((p) => p.id === row.playerId)
          const player = game.players[seat]
          return (
            <div
              key={row.playerId}
              className={`grid grid-cols-[2rem_1fr_auto] items-center px-[0.8rem] py-[0.3rem] text-[1.05rem] odd:bg-stone-50 ${
                row.playerId === view.winner ? 'font-extrabold' : ''
              }`}
            >
              <span>{k === 0 ? '🏆' : k + 1}</span>
              <span className="flex items-center gap-[0.5rem]">
                <Avatar src={skinById(seats[row.playerId]?.skin ?? SEAT_SKINS[seat % SEAT_SKINS.length]).avatar} color={playerColors[seat % playerColors.length]} className="h-[1.8rem] w-[1.8rem] border-[0.1rem]" />
                {player.name}
                {row.bankrupt && <span className="text-[0.85rem] text-rose-400">phá sản</span>}
              </span>
              <Money amount={row.netWorth} />
            </div>
          )
        })}
      </div>
      {earned > 0 && (
        <div className="mt-[0.7rem] flex items-center justify-center gap-[0.4rem] text-[1.25rem] font-extrabold text-amber-600">
          +<Money amount={earned} /> Vàng
        </div>
      )}
      <div className="mt-[0.8rem] flex justify-center gap-[0.8rem]">
        <button className="btn-3d btn-gray px-[1.6rem] py-[0.5rem] text-[1.2rem]" onClick={onMenu}>
          Về Menu
        </button>
        <button className="btn-3d btn-blue px-[2rem] py-[0.5rem] text-[1.2rem]" onClick={onRestart}>
          Chơi lại
        </button>
      </div>
    </Modal>
  )
}

