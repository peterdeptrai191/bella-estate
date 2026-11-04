/** Chơi cùng bạn: tạo phòng (2–4 người), vào phòng bằng mã, ghép trận nhanh; sảnh chờ. */
import { useEffect, useState } from 'react'
import { NET } from '../../net/protocol'
import { skinById } from '../../config/skins'
import { createRoom, joinRoom, leaveRoom, quickMatch, startNow } from '../../store/net'
import { useOnlineStore } from '../../store/onlineStore'
import { displayName, useProfileStore } from '../../store/profileStore'
import { useUiStore } from '../../store/uiStore'
import { useVisual } from '../../store/visualStore'
import { unlockAudio } from '../../audio/soundPlayer'
import { ScreenFrame } from './ScreenFrame'

function useJoinOptions() {
  const { name, skin } = useProfileStore()
  return { name: displayName(name), skin }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[0.6rem] rounded-xl bg-white p-[0.9rem] shadow">
      <div className="text-[1.1rem] font-extrabold text-ink uppercase">{title}</div>
      {children}
    </div>
  )
}

export function FriendsScreen() {
  const opts = useJoinOptions()
  const setScreen = useUiStore((s) => s.setScreen)
  const { status, error, pendingLabel } = useOnlineStore()
  const [capacity, setCapacity] = useState(4)
  const [code, setCode] = useState('')

  // Vào phòng thành công → sang sảnh chờ.
  useEffect(() => {
    if (status === 'lobby') setScreen('lobby')
  }, [status, setScreen])

  const busy = status === 'connecting'
  const go = (fn: () => Promise<void>) => () => {
    unlockAudio()
    void fn()
  }

  return (
    <ScreenFrame title="Chơi cùng bạn" width="w-[48rem]">
      <div className="flex gap-[0.9rem] max-[640px]:flex-col">
        <Section title="Tạo phòng">
          <div className="flex gap-[0.4rem]">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCapacity(n)}
                className={`rounded-lg border-[0.15rem] px-[0.7rem] py-[0.2rem] text-[1.05rem] font-extrabold ${
                  capacity === n ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-stone-200 text-stone-500'
                }`}
              >
                {n} người
              </button>
            ))}
          </div>
          <button className="btn-3d btn-green px-[1.4rem] py-[0.4rem] text-[1.15rem]" disabled={busy} onClick={go(() => createRoom({ ...opts, capacity }))}>
            Tạo phòng
          </button>
          <p className="text-center text-[0.9rem] text-stone-400">Gửi mã phòng cho bạn bè để cùng chơi.</p>
        </Section>
        <Section title="Vào phòng">
          <input
            id="room-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, NET.codeLength))}
            placeholder="Nhập mã"
            className="w-[10rem] rounded-lg border-[0.15rem] border-stone-200 bg-cream px-[0.6rem] py-[0.25rem] text-center text-[1.4rem] font-extrabold tracking-[0.25em] text-ink outline-none placeholder:text-[1.1rem] placeholder:tracking-normal focus:border-sky-400"
          />
          <button
            className="btn-3d btn-blue px-[1.4rem] py-[0.4rem] text-[1.15rem]"
            disabled={busy || code.length !== NET.codeLength}
            onClick={go(() => joinRoom(code, opts))}
          >
            Vào phòng
          </button>
        </Section>
        <Section title="Ghép trận nhanh">
          <p className="text-center text-[0.95rem] text-stone-500">
            Ghép với người chơi khác. Chờ quá {NET.quickWaitSec} giây thì thêm bot cho đủ bàn.
          </p>
          <button className="btn-3d btn-pink px-[1.4rem] py-[0.4rem] text-[1.15rem]" disabled={busy} onClick={go(() => quickMatch(opts))}>
            Tìm trận
          </button>
        </Section>
      </div>
      {busy && <p className="mt-[0.8rem] text-center text-[1.05rem] font-bold text-sky-600">{pendingLabel}</p>}
      {error && <p className="mt-[0.8rem] text-center text-[1.05rem] font-bold text-rose-500">{error}</p>}
    </ScreenFrame>
  )
}

export function LobbyScreen() {
  const lobby = useOnlineStore((s) => s.lobby)
  const status = useOnlineStore((s) => s.status)
  const setScreen = useUiStore((s) => s.setScreen)
  const { playerColors } = useVisual()
  const [now, setNow] = useState(() => Date.now())
  const receivedAt = useOnlineStore((s) => s.lobbyAt)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (status === 'idle' || status === 'error') setScreen('friends')
  }, [status, setScreen])

  const back = () => {
    void leaveRoom()
    setScreen('friends')
  }
  if (!lobby) return null
  const you = lobby.seats[lobby.you]
  const humans = lobby.seats.filter((s) => s.kind === 'human').length
  const remaining = lobby.quickRemainingMs === null ? null : Math.max(0, Math.ceil((lobby.quickRemainingMs - (now - receivedAt)) / 1000))
  const empty = Math.max(0, lobby.capacity - lobby.seats.length)

  return (
    <ScreenFrame title={lobby.mode === 'quick' ? 'Ghép trận nhanh' : 'Phòng chờ'} width="w-[40rem]" onBack={back}>
      {lobby.mode === 'private' && (
        <div className="mb-[0.8rem] flex flex-col items-center gap-[0.3rem]">
          <div className="text-[1rem] font-bold text-stone-500 uppercase">Mã phòng</div>
          <div className="flex items-center gap-[0.6rem]">
            <span className="rounded-xl bg-white px-[1rem] py-[0.1rem] text-[2.4rem] font-extrabold tracking-[0.3em] text-ink shadow select-all">{lobby.code}</span>
            <button
              className="btn-3d btn-blue px-[0.9rem] py-[0.3rem] text-[1rem]"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(lobby.code)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false))
              }}
            >
              {copied ? 'Đã chép' : 'Chép mã'}
            </button>
          </div>
        </div>
      )}
      {remaining !== null && (
        <p className="mb-[0.6rem] text-center text-[1.1rem] font-bold text-sky-600">
          Đang chờ người chơi… thêm bot sau <span className="tabular-nums">{remaining}</span> giây
        </p>
      )}
      <div className="grid grid-cols-4 gap-[0.6rem]">
        {lobby.seats.map((seat, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl bg-white p-[0.5rem] shadow">
            <img
              src={skinById(seat.skin).avatar}
              alt=""
              className="h-[4.6rem] w-[4.6rem] rounded-full border-[0.2rem] border-white shadow"
              style={{ background: playerColors[i % playerColors.length] }}
            />
            <div className="mt-[0.2rem] line-clamp-1 text-[1.05rem] font-extrabold text-ink">{seat.name}</div>
            <div className="text-[0.85rem] font-bold text-stone-400">
              {i === lobby.you ? 'Bạn' : seat.kind === 'bot' ? 'Bot' : 'Người chơi'}
              {seat.isHost && lobby.mode === 'private' ? ' · Chủ phòng' : ''}
            </div>
          </div>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <div key={`e${i}`} className="flex h-full min-h-[8rem] flex-col items-center justify-center rounded-xl border-[0.18rem] border-dashed border-stone-300 text-[0.95rem] font-bold text-stone-400">
            Đang chờ…
          </div>
        ))}
      </div>
      {lobby.mode === 'private' && (
        <div className="mt-[1rem] flex flex-col items-center gap-[0.3rem]">
          {you?.isHost ? (
            <button className="btn-3d btn-green px-[2.4rem] py-[0.5rem] text-[1.3rem]" disabled={humans < NET.minPlayers} onClick={startNow}>
              BẮT ĐẦU ({humans}/{lobby.capacity})
            </button>
          ) : (
            <p className="text-[1.05rem] font-bold text-stone-500">Chờ chủ phòng bắt đầu…</p>
          )}
          <p className="text-[0.9rem] text-stone-400">Đủ {lobby.capacity} người thì ván tự bắt đầu.</p>
        </div>
      )}
    </ScreenFrame>
  )
}
