/** Thành phần giao diện dùng chung: khung popup dải ruy băng, đồng xu, hình minh họa cấp nhà, avatar. */
import type { ReactNode } from 'react'
import { formatMoney } from '../game-core'

export function CoinIcon({ className = 'h-[1em] w-[1em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`inline-block shrink-0 ${className}`} aria-hidden>
      <circle cx="10" cy="11" r="8" fill="#d99a1a" />
      <circle cx="10" cy="9.5" r="8" fill="#ffc83d" />
      <circle cx="10" cy="9.5" r="5.6" fill="none" stroke="#e8a21e" strokeWidth="1.4" />
      <path d="M7.5 7.2 L10 5.6 L12.5 7.2" fill="none" stroke="#fff3c4" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function Money({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.25em] tabular-nums ${className}`}>
      {formatMoney(amount)}
      <CoinIcon />
    </span>
  )
}

export function Avatar({ src, color, className = '' }: { src: string; color: string; className?: string }) {
  return (
    <span
      className={`block overflow-hidden rounded-full border-[0.18em] border-white bg-gradient-to-b from-white/70 to-transparent shadow-md ${className}`}
      style={{ backgroundColor: color }}
    >
      <img src={src} alt="" draggable={false} className="h-full w-full scale-110 object-cover object-top" />
    </span>
  )
}

/**
 * Khung popup: tờ giấy kem có 2 tờ xếp chồng phía sau, dải ruy băng tiêu đề, nút đóng tròn.
 * `onClose` không có thì ẩn nút đóng (việc bắt buộc).
 */
export function Modal({
  title,
  ribbon = '#2fa7e6',
  onClose,
  children,
  className = 'w-[30rem]',
  onBackdrop,
  layer = 'z-30',
}: {
  title: ReactNode
  ribbon?: string
  onClose?: () => void
  children: ReactNode
  className?: string
  /** Bấm ra ngoài khung. */
  onBackdrop?: () => void
  layer?: string
}) {
  return (
    <div
      className={`pointer-events-auto absolute inset-0 ${layer} flex items-center justify-center bg-[#1d3b5a]/45`}
      onClick={(e) => {
        if (onBackdrop && e.target === e.currentTarget) onBackdrop()
      }}
    >
      <div className={`animate-pop-in relative max-w-[92vw] ${className}`}>
        <div className="absolute inset-0 translate-x-[0.5rem] translate-y-[0.7rem] rotate-[2.5deg] rounded-[1.6rem] bg-cream-dark shadow-lg" />
        <div className="absolute inset-0 -translate-x-[0.3rem] translate-y-[0.4rem] -rotate-[1.5deg] rounded-[1.6rem] bg-[#f3ebdc] shadow" />
        <div className="relative rounded-[1.6rem] bg-cream px-[1.6rem] pt-[2.6rem] pb-[1.4rem] shadow-xl">
          <Ribbon color={ribbon}>{title}</Ribbon>
          {onClose && (
            <button
              aria-label="Đóng"
              onClick={onClose}
              className="btn-3d btn-pink absolute -top-[1.3rem] -right-[1.1rem] z-10 flex h-[2.6rem] w-[2.6rem] items-center justify-center text-[1.4rem] leading-none"
            >
              ✕
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/** Dải ruy băng tiêu đề có hai đuôi gấp, nằm vắt ngang mép trên khung. */
export function Ribbon({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="absolute -top-[1.1rem] left-1/2 w-[calc(100%+1.6rem)] -translate-x-1/2">
      <span
        className="absolute top-[0.55rem] -left-[0.3rem] h-[2.4rem] w-[2rem] rounded-l-md brightness-75"
        style={{ background: color, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,30% 50%)' }}
      />
      <span
        className="absolute top-[0.55rem] -right-[0.3rem] h-[2.4rem] w-[2rem] rounded-r-md brightness-75"
        style={{ background: color, clipPath: 'polygon(0 0,100% 0,70% 50%,100% 100%,0 100%)' }}
      />
      <div
        className="relative mx-[1rem] rounded-xl px-[1rem] py-[0.45rem] text-center text-[1.35rem] font-extrabold tracking-wide text-white uppercase shadow-md"
        style={{ background: color, textShadow: '0 0.1em 0 rgb(0 0 0 / 0.22)' }}
      >
        {children}
      </div>
    </div>
  )
}

function IsoHouse({ x, y, w, h, roof }: { x: number; y: number; w: number; h: number; roof: string }) {
  const top = y - h
  const apex = top - w / 2 - w * 0.85
  return (
    <g strokeLinejoin="round">
      <polygon points={`${x - w},${y - w / 2} ${x},${y} ${x},${top} ${x - w},${top - w / 2}`} fill="#f4efe8" />
      <polygon points={`${x},${y} ${x + w},${y - w / 2} ${x + w},${top - w / 2} ${x},${top}`} fill="#d9d1c6" />
      <polygon
        points={`${x - w * 0.7},${y - w * 0.35 - h * 0.3} ${x - w * 0.3},${y - w * 0.15 - h * 0.3} ${x - w * 0.3},${y - w * 0.15 - h * 0.68} ${x - w * 0.7},${y - w * 0.35 - h * 0.68}`}
        fill="#9fd3f2"
      />
      <polygon points={`${x - w},${top - w / 2} ${x},${top} ${x},${apex}`} fill={roof} />
      <polygon points={`${x},${top} ${x + w},${top - w / 2} ${x},${apex}`} fill={roof} style={{ filter: 'brightness(0.8)' }} />
    </g>
  )
}

function IsoTower({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  const top = y - h
  return (
    <g>
      <polygon points={`${x - w},${y - w / 2} ${x},${y} ${x},${top} ${x - w},${top - w / 2}`} fill="#f4efe8" />
      <polygon points={`${x},${y} ${x + w},${y - w / 2} ${x + w},${top - w / 2} ${x},${top}`} fill="#d9d1c6" />
      {[0.2, 0.42, 0.64].map((k) => (
        <g key={k}>
          <polygon
            points={`${x - w * 0.8},${y - w * 0.4 - h * k} ${x - w * 0.2},${y - w * 0.1 - h * k} ${x - w * 0.2},${y - w * 0.1 - h * (k + 0.12)} ${x - w * 0.8},${y - w * 0.4 - h * (k + 0.12)}`}
            fill="#9fd3f2"
          />
          <polygon
            points={`${x + w * 0.2},${y - w * 0.1 - h * k} ${x + w * 0.8},${y - w * 0.4 - h * k} ${x + w * 0.8},${y - w * 0.4 - h * (k + 0.12)} ${x + w * 0.2},${y - w * 0.1 - h * (k + 0.12)}`}
            fill="#7fbde3"
          />
        </g>
      ))}
      <polygon points={`${x - w},${top - w / 2} ${x},${top} ${x + w},${top - w / 2} ${x},${top - w}`} fill={color} />
      <rect x={x - 0.6} y={top - w - 9} width={1.2} height={9} fill="#9a8f84" />
      <polygon points={`${x + 0.6},${top - w - 9} ${x + 7},${top - w - 7} ${x + 0.6},${top - w - 5}`} fill={color} />
    </g>
  )
}

/** Hình minh họa isometric một ô ở cấp `level` (0 đất, 1–3 nhà, 4 Landmark; -1 = khu du lịch). */
export function LevelIcon({ level, color, className = '' }: { level: number; color: string; className?: string }) {
  const houses: Array<[number, number]> = [
    [50, 47],
    [36, 42],
    [64, 44],
  ]
  const order = level === 1 ? [houses[0]] : level === 2 ? [houses[1], houses[2]] : [houses[1], houses[2], houses[0]]
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <polygon points="10,44 50,64 90,44 90,49 50,69 10,49" fill="#7cae5a" />
      <polygon points="50,24 90,44 50,64 10,44" fill={level < 0 ? '#bde8f0' : '#a9d97f'} />
      {level < 0 && (
        <g>
          <ellipse cx="46" cy="46" rx="18" ry="8" fill="#6fcbe0" />
          <rect x="63" y="22" width="1.6" height="20" fill="#bcae9c" />
          <polygon points="52,26 76,26 64,18" fill="#ff8fab" />
        </g>
      )}
      {level >= 1 && level <= 3 && order.map(([x, y], i) => <IsoHouse key={i} x={x} y={y} w={9} h={9} roof={color} />)}
      {level >= 4 && <IsoTower x={50} y={50} w={13} h={30} color={color} />}
    </svg>
  )
}
