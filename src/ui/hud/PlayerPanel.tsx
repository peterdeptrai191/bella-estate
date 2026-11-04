import { useEffect, useRef, useState } from 'react'
import { formatMoney } from '../../game-core'
import type { PlayerView } from '../../store/boardView'
import type { TurnDeadline } from '../../store/uiStore'
import { useSeatSkin } from '../../store/gameStore'
import { useVisual } from '../../store/visualStore'
import { Avatar, CoinIcon } from '../kit'
import { useCountUp, useRemaining } from '../useCountUp'

/** Vị trí 4 góc theo thứ tự ghế, chiều kim đồng hồ từ góc dưới trái (ghế 0 = người chơi trên máy). */
const CORNERS = [
  // Cầm dọc: hàng trên nằm dưới thanh Vòng/Thoát và dòng mô tả sự kiện, hàng dưới nằm trên nút Tung xúc xắc.
  { box: 'left-[1rem] bottom-[1rem] portrait:bottom-[6.2rem]', right: false },
  { box: 'left-[1rem] top-[1rem] portrait:top-[6.8rem]', right: false },
  { box: 'right-[1rem] top-[1rem] portrait:top-[6.8rem]', right: true },
  { box: 'right-[1rem] bottom-[1rem] portrait:bottom-[6.2rem]', right: true },
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
      </div>
    </div>
  )
}
