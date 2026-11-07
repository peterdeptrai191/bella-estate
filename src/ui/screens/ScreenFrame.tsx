/** Khung chung cho các màn hình menu: nền mờ phủ lên bàn cờ 3D, thẻ hồ sơ, nút quay lại. */
import { useState, type ReactNode } from 'react'
import { setMuted, unlockAudio } from '../../audio/soundPlayer'
import { META, skinById } from '../../config/skins'
import { formatMoney } from '../../game-core'
import { useProfileStore } from '../../store/profileStore'
import { useAuthStore } from '../../store/authStore'
import { useUiStore, type Screen } from '../../store/uiStore'
import { CoinIcon, Ribbon } from '../kit'

export function ProfileChip() {
  const { name, skin, gold, setName } = useProfileStore()
  const account = useAuthStore((s) => s.account)
  const [editing, setEditing] = useState(false)
  return (
    <div className="pointer-events-auto flex items-center gap-[0.6rem] rounded-2xl bg-cream/95 py-[0.35rem] pr-[1rem] pl-[0.35rem] shadow-lg">
      <img src={skinById(skin).avatar} alt="" className="h-[3.4rem] w-[3.4rem] rounded-xl bg-gradient-to-b from-sky-200 to-sky-100" />
      <div className="flex flex-col leading-tight">
        {editing ? (
          <input
            id="profile-name"
            autoFocus
            maxLength={META.maxNameLength}
            defaultValue={name}
            onBlur={(e) => {
              const next = e.currentTarget.value.trim() || META.defaultName
              setName(next)
              void useAuthStore.getState().rename(next)
              setEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            className="w-[9rem] rounded-md border-2 border-sky-300 bg-white px-[0.3rem] text-[1.15rem] font-extrabold text-ink outline-none"
          />
        ) : (
          <button className="text-left text-[1.2rem] font-extrabold text-ink" onClick={() => setEditing(true)} title="Đổi tên">
            {name} <span className="text-[0.9rem] text-stone-400">✎</span>
          </button>
        )}
        <span className="flex items-center gap-[0.3rem] text-[1.1rem] font-extrabold text-amber-600 tabular-nums">
          {formatMoney(gold)} <CoinIcon /> <span className="text-[0.85rem] font-bold text-stone-400">Vàng</span>
        </span>
        {account ? (
          <span className="flex items-center gap-[0.4rem] text-[0.85rem] font-bold text-stone-400">
            @{account.username}
            <button className="text-sky-600 underline-offset-2 hover:underline" onClick={() => void useAuthStore.getState().logout()}>
              Đăng xuất
            </button>
          </span>
        ) : (
          <button
            className="self-start text-[0.9rem] font-extrabold text-sky-600 underline-offset-2 hover:underline"
            onClick={() => useAuthStore.getState().setOpen(true)}
          >
            Đăng nhập / Tạo tài khoản
          </button>
        )}
      </div>
    </div>
  )
}

export function SoundButton() {
  const [muted, setMutedState] = useState(false)
  return (
    <button
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      className="btn-3d btn-blue pointer-events-auto flex h-[2.8rem] w-[2.8rem] items-center justify-center text-[1.3rem]"
      onClick={() => {
        unlockAudio()
        setMuted(!muted)
        setMutedState(!muted)
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

/** Màn hình con: tiêu đề ruy băng + nút quay lại. */
export function ScreenFrame({
  title,
  back = 'home',
  onBack,
  children,
  width = 'w-[44rem]',
}: {
  title: string
  back?: Screen
  onBack?: () => void
  children: ReactNode
  width?: string
}) {
  const setScreen = useUiStore((s) => s.setScreen)
  return (
    <div className="absolute inset-0 flex items-center justify-center p-[1rem]">
      <button
        aria-label="Quay lại"
        className="btn-3d btn-blue absolute bottom-[1.2rem] left-[1.2rem] z-10 flex h-[3.2rem] w-[3.2rem] items-center justify-center text-[1.6rem]"
        onClick={() => (onBack ? onBack() : setScreen(back))}
      >
        ←
      </button>
      <div className={`animate-pop-in relative max-h-[calc(100%-2rem)] max-w-[94vw] ${width}`}>
        <div className="absolute inset-0 translate-x-[0.5rem] translate-y-[0.7rem] rotate-[1.5deg] rounded-[1.6rem] bg-cream-dark shadow-lg" />
        <div className="relative flex max-h-[calc(100vh-4rem)] flex-col rounded-[1.6rem] bg-cream px-[1.6rem] pt-[2.6rem] pb-[1.4rem] shadow-xl">
          <Ribbon color="#f2b51d">{title}</Ribbon>
          <div className="min-h-0 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Thẻ lựa chọn kiểu "nút to" (dùng ở trang chủ). */
export function MenuCard({
  title,
  art,
  onClick,
  badge,
  disabled,
  accent,
}: {
  title: string
  art: ReactNode
  onClick: () => void
  badge?: string
  disabled?: boolean
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-[12.5rem] flex-col items-stretch overflow-hidden rounded-[1.4rem] bg-cream text-left shadow-[0_0.4rem_0_rgb(0_0_0/0.12),0_0.8rem_1.4rem_rgb(30_50_90/0.25)] transition hover:-translate-y-[0.3rem] active:translate-y-0 ${
        disabled ? 'saturate-[0.55]' : ''
      }`}
    >
      <span className="px-[0.9rem] pt-[0.6rem] text-center text-[1.15rem] font-extrabold tracking-wide text-ink uppercase">{title}</span>
      <span className="mx-[0.7rem] mb-[0.7rem] mt-[0.3rem] block h-[7.4rem] rounded-xl p-[0.4rem]" style={{ background: accent }}>
        {art}
      </span>
      {badge && (
        <span className="absolute top-[3.4rem] -right-[2.6rem] w-[10rem] rotate-[35deg] bg-[#f2437a] py-[0.15rem] text-center text-[0.8rem] font-extrabold tracking-wider text-white uppercase shadow">
          {badge}
        </span>
      )}
    </button>
  )
}
