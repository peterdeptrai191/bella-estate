import { useEffect, useRef, useState } from 'react'
import { BOARD, COLOR_GROUPS, RESORT_COLOR } from '../../config/board'
import { CARDS } from '../../config/cards'
import { formatMoney } from '../../game-core'
import { useAnimationStore } from '../../store/animationStore'
import { useUiStore } from '../../store/uiStore'
import type { PlayerView } from '../../store/boardView'
import type { TurnDeadline } from '../../store/uiStore'
import { useSeatSkin } from '../../store/gameStore'
import { useVisual } from '../../store/visualStore'
import { Avatar, CoinIcon } from '../kit'
import { useCountUp, useRemaining } from '../useCountUp'

/** Vị trí 4 góc theo thứ tự ghế, chiều kim đồng hồ từ góc dưới trái (ghế 0 = người chơi trên máy). */
const CORNERS = [
  // Cầm dọc: hàng trên nằm dưới thanh Vòng/Thoát và dòng mô tả sự kiện, hàng dưới sát đáy (nút Tung nằm giữa bàn cờ).
  { box: 'left-[1rem] bottom-[1rem] portrait:bottom-[1.5rem]', right: false },
  { box: 'left-[1rem] top-[1rem] portrait:top-[6.8rem]', right: false },
  { box: 'right-[1rem] top-[1rem] portrait:top-[6.8rem]', right: true },
  { box: 'right-[1rem] bottom-[1rem] portrait:bottom-[1.5rem]', right: true },
]

function TimerRing({ deadline, color }: { deadline: TurnDeadline; color: string }) {
  const remaining = useRemaining(deadline.startedAt, deadline.endsAt)
  const r = 46
  const length = 2 * Math.PI * r
  const urgent = remaining < 0.25
  return (
    <svg viewBox="0 0 100 100" className="absolute -inset-[0.45rem] -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.85)" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={urgent ? '#f2437a' : color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - remaining)}
      />
    </svg>
  )
}

const CARD_ICON = { ESCAPE_ISLAND: '🏝️', SHIELD: '🛡️', DISCOUNT: '🏷️' } as const

/** Tài sản đang có: một ô màu cho mỗi đất (số nhà / ★ Landmark) và các thẻ Cơ Hội đang giữ. Bấm đất để xem chi tiết. */
function AssetStrip({ player, right }: { player: PlayerView; right: boolean }) {
  const tiles = useAnimationStore((s) => s.view?.tiles)
  const selectTile = useUiStore((s) => s.selectTile)
  const owned = (tiles ?? []).flatMap((t, i) => (t.owner === player.id ? [{ index: i, level: t.level }] : []))
  const cards = [...player.heldCards, ...(player.rentDiscount ? (['DISCOUNT'] as const) : [])]
  if (player.bankrupt || (owned.length === 0 && cards.length === 0)) return null
  return (
    <div
      className={`pointer-events-auto mt-[0.3rem] flex max-w-[13.5rem] flex-wrap gap-[0.2rem] rounded-lg bg-white/75 p-[0.25rem] shadow-sm ${right ? 'justify-end' : ''}`}
    >
      {owned.map(({ index, level }) => {
        const def = BOARD[index]
        const color = def.group ? (COLOR_GROUPS.find((g) => g.id === def.group)?.color ?? '#999') : RESORT_COLOR
        const maxed = def.kind === 'CITY' && level >= 4
        return (
          <button
            key={index}
            title={`${def.name}${def.kind === 'CITY' ? (maxed ? ' · Landmark' : level > 0 ? ` · ${level} nhà` : ' · đất trống') : ''}`}
            aria-label={def.name}
            onClick={() => selectTile(index)}
            className="flex h-[1.35rem] w-[1.35rem] items-center justify-center rounded-[0.35rem] border-[0.12rem] border-white text-[0.75rem] leading-none font-extrabold text-white shadow-sm"
            style={{ background: color, textShadow: '0 0.06em 0 rgb(0 0 0 / 0.3)' }}
          >
            {maxed ? '★' : level > 0 ? level : ''}
          </button>
        )
      })}
      {cards.map((card, i) => (
        <span
          key={`${card}-${i}`}
          title={CARDS[card].name}
          className="flex h-[1.35rem] w-[1.35rem] items-center justify-center rounded-full bg-amber-100 text-[0.8rem] leading-none shadow-sm ring-1 ring-amber-300"
        >
          {CARD_ICON[card]}
        </span>
      ))}
    </div>
  )
}

interface MoneyFloat {
  id: number
  delta: number
}

let floatId = 1

export function PlayerPanel({
  player,
  corner: cornerIndex,
  active,
  isYou,
  isBot,
  offline = false,
  deadline,
}: {
  player: PlayerView
  /** Góc màn hình 0–3 (0 = dưới trái, theo chiều kim đồng hồ). */
  corner: number
  active: boolean
  isYou: boolean
  isBot: boolean
  /** Online: người chơi đang mất kết nối (bot tạm chơi thay). */
  offline?: boolean
  deadline: TurnDeadline | null
}) {
  const { playerColors, animation } = useVisual()
  const color = playerColors[player.seat % playerColors.length]
  const avatar = useSeatSkin(player.id, player.seat).avatar
  const corner = CORNERS[cornerIndex % CORNERS.length]
  const money = useCountUp(player.money, animation.moneyCountDuration)

  // Số tiền +/- bay lên khi tiền thay đổi.
  const [floats, setFloats] = useState<MoneyFloat[]>([])
  const previous = useRef(player.money)
  useEffect(() => {
    const delta = player.money - previous.current
    previous.current = player.money
    if (delta === 0) return
    const item = { id: floatId++, delta }
    // oxlint-disable-next-line react/set-state-in-effect -- hiệu ứng phản hồi khi prop đổi
    setFloats((list) => [...list, item])
    const timer = setTimeout(() => setFloats((list) => list.filter((f) => f.id !== item.id)), 1100)
    return () => clearTimeout(timer)
  }, [player.money])

  return (
    <div
      className={`absolute ${corner.box} flex items-center ${corner.right ? 'flex-row-reverse' : ''} transition-transform duration-300 ${
        active ? 'scale-105' : ''
      } ${player.bankrupt ? 'opacity-50 grayscale' : ''}`}
      style={{ ['--glow' as string]: `${color}aa` }}
    >
      <div className="relative z-10 h-[4.6rem] w-[4.6rem] shrink-0">
        {active && deadline && <TimerRing deadline={deadline} color={color} />}
        <Avatar
          src={avatar}
          color={color}
          className={`h-full w-full ${active ? 'animate-pulse-ring' : ''}`}
        />
        {offline && (
          <span className="absolute -top-[0.3rem] left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-[0.45rem] text-[0.65rem] leading-[1.1rem] font-extrabold whitespace-nowrap text-white">
            MẤT KẾT NỐI
          </span>
        )}
        {(isBot || isYou) && (
          <span
            className={`absolute -bottom-[0.2rem] left-1/2 -translate-x-1/2 rounded-full px-[0.45rem] text-[0.7rem] leading-[1.15rem] font-extrabold text-white ${
              isYou ? 'bg-emerald-500' : 'bg-ink'
            }`}
          >
            {isYou ? 'BẠN' : 'BOT'}
          </span>
        )}
      </div>
      <div
        className={`relative flex flex-col ${corner.right ? 'mr-[-0.9rem] items-end' : 'ml-[-0.9rem] items-start'}`}
      >
        <div
          className={`relative min-w-[9.5rem] rounded-xl bg-cream py-[0.25rem] shadow-md ${
            corner.right ? 'pr-[1.4rem] pl-[0.8rem] text-right' : 'pr-[0.8rem] pl-[1.4rem]'
          } ${active ? 'ring-[0.18rem]' : ''}`}
          style={{ ['--tw-ring-color' as string]: color }}
        >
          <span className="flex items-center gap-[0.3rem] text-[1.25rem] leading-tight font-extrabold text-ink tabular-nums">
            {player.bankrupt ? 'Phá sản' : formatMoney(money)}
            {!player.bankrupt && <CoinIcon />}
          </span>
          {floats.map((f) => (
            <span
              key={f.id}
              className={`animate-float-up pointer-events-none absolute top-0 ${corner.right ? 'right-[1.4rem]' : 'left-[1.4rem]'} text-[1.3rem] font-extrabold whitespace-nowrap ${
                f.delta > 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
              style={{ textShadow: '0 0.08em 0 white, 0 0 0.3em white' }}
            >
              {f.delta > 0 ? '+' : '−'}
              {formatMoney(Math.abs(f.delta))}
            </span>
          ))}
        </div>
        <div
          className={`-mt-[0.15rem] px-[1.4rem] py-[0.1rem] text-[1.05rem] font-extrabold tracking-wide text-white uppercase shadow-md ${
            corner.right ? 'rounded-l-lg' : 'rounded-r-lg'
          }`}
          style={{
            background: color,
            textShadow: '0 0.08em 0 rgb(0 0 0 / 0.25)',
            clipPath: corner.right
              ? 'polygon(0.6rem 0,100% 0,100% 100%,0.6rem 100%,0 50%)'
              : 'polygon(0 0,calc(100% - 0.6rem) 0,100% 50%,calc(100% - 0.6rem) 100%,0 100%)',
          }}
        >
          {player.name}
        </div>
        <AssetStrip player={player} right={corner.right} />
      </div>
    </div>
  )
}
