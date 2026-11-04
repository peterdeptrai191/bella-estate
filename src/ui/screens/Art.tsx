/** Hình minh họa cho các thẻ chế độ chơi (SVG tự vẽ). Logo game/nhà phát hành là ảnh trong public/brand. */

export function GlobeArt({ avatars }: { avatars: string[] }) {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 70" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="38" r="27" fill="#3fa9e8" />
        <path d="M27 32c6-4 10-1 13 3s8 3 9-2 6-7 12-4 5 7 10 7" fill="none" stroke="#7fd36b" strokeWidth="7" strokeLinecap="round" />
        <path d="M30 50c5 1 8-1 12 0s6 6 12 4 8-4 12-3" fill="none" stroke="#7fd36b" strokeWidth="6" strokeLinecap="round" />
        <path d="M14 22c10-12 22-16 36-16" fill="none" stroke="#ff8fab" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M86 54c-8 10-20 14-36 13" fill="none" stroke="#ff8fab" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
      {avatars.slice(0, 2).map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={`absolute bottom-[4%] h-[52%] rounded-full border-[0.18rem] border-white bg-sky-100 shadow-md ${i === 0 ? 'left-[8%]' : 'right-[8%]'}`}
        />
      ))}
    </div>
  )
}

export function RobotArt() {
  return (
    <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden>
      <rect x="47" y="4" width="6" height="10" rx="3" fill="#9aa7b8" />
      <circle cx="50" cy="5" r="5" fill="#ff5c8a" />
      <rect x="22" y="14" width="56" height="42" rx="14" fill="#e7eef7" stroke="#9aa7b8" strokeWidth="3" />
      <rect x="30" y="22" width="40" height="22" rx="9" fill="#2b3a55" />
      <circle cx="41" cy="33" r="5" fill="#5fe0b0" />
      <circle cx="59" cy="33" r="5" fill="#5fe0b0" />
      <rect x="40" y="47" width="20" height="4" rx="2" fill="#9aa7b8" />
      <rect x="12" y="28" width="10" height="16" rx="5" fill="#ffc83d" />
      <rect x="78" y="28" width="10" height="16" rx="5" fill="#ffc83d" />
      <rect x="34" y="58" width="32" height="8" rx="4" fill="#9aa7b8" />
    </svg>
  )
}

export function ShopArt() {
  return (
    <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden>
      <rect x="18" y="30" width="64" height="36" rx="3" fill="#fff6e8" stroke="#d9c7ae" strokeWidth="2" />
      <rect x="26" y="40" width="20" height="26" rx="2" fill="#8fd0ff" />
      <rect x="52" y="40" width="22" height="14" rx="2" fill="#8fd0ff" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${14 + i * 12} 16h12v12a6 6 0 0 1-12 0z`} fill={i % 2 ? '#ffffff' : '#ff5c8a'} stroke="#e04a77" strokeWidth="1" />
      ))}
      <rect x="12" y="10" width="76" height="7" rx="3" fill="#e04a77" />
      <circle cx="80" cy="58" r="9" fill="#ffc83d" stroke="#d99a1a" strokeWidth="2" />
      <path d="M77 58h6M80 55v6" stroke="#b5760a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function MapArt() {
  return (
    <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden>
      <polygon points="14,14 36,8 62,14 86,8 86,60 62,66 36,60 14,66" fill="#fff6e8" stroke="#d9c7ae" strokeWidth="2" />
      <polygon points="36,8 62,14 62,66 36,60" fill="#f1e6d3" />
      <path d="M22 50c8-10 14 4 22-6s14-12 22-4 10 0 14-6" fill="none" stroke="#ff8fab" strokeWidth="2.5" strokeDasharray="4 3" />
      <circle cx="72" cy="30" r="8" fill="#ff5c8a" />
      <circle cx="72" cy="30" r="3" fill="#fff" />
      <path d="M66 34l6 12 6-12" fill="#ff5c8a" />
      <path d="M22 22h8M24 30h10" stroke="#9fd3a0" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
