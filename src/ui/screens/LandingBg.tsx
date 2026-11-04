/** Nền xanh của các màn hình menu: sọc chéo mờ + hình vẽ nét mảnh (xúc xắc, nhà, đồng xu, máy bay…). */

const DOODLES: Array<{ d: string; x: string; y: string; size: string; rotate: number }> = [
  // xúc xắc
  { d: 'M6 6h28v28H6z M14 14h.1 M26 26h.1 M20 20h.1', x: '6%', y: '18%', size: '4.5rem', rotate: -12 },
  // ngôi nhà
  { d: 'M6 20 20 8l14 12 M10 17v15h20V17 M17 32v-8h6v8', x: '88%', y: '12%', size: '5rem', rotate: 8 },
  // đồng xu
  { d: 'M20 4a16 16 0 1 0 0 32 16 16 0 1 0 0-32 M20 11v18 M15 15h8a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h8', x: '78%', y: '62%', size: '4rem', rotate: 0 },
  // máy bay
  { d: 'M4 22 36 8l-8 26-7-10-9 4 2-8z', x: '45%', y: '6%', size: '3.6rem', rotate: 10 },
  // cúp
  { d: 'M12 6h16v8a8 8 0 0 1-16 0z M12 9H6a6 6 0 0 0 6 7 M28 9h6a6 6 0 0 1-6 7 M20 22v7 M13 34h14', x: '12%', y: '72%', size: '4.2rem', rotate: -8 },
  // ngôi sao
  { d: 'M20 4l4.5 10 10.5 1-8 7 2.5 11L20 27l-9.5 6L13 22l-8-7 10.5-1z', x: '60%', y: '88%', size: '3rem', rotate: 14 },
  // địa cầu
  { d: 'M20 4a16 16 0 1 0 0 32 16 16 0 1 0 0-32 M4 20h32 M20 4c-6 6-6 26 0 32 M20 4c6 6 6 26 0 32', x: '33%', y: '48%', size: '3.4rem', rotate: 0 },
  // chìa khóa nhà
  { d: 'M12 14a6 6 0 1 0 0 12 6 6 0 1 0 0-12 M18 20h16 M30 20v5 M26 20v4', x: '92%', y: '86%', size: '3.6rem', rotate: -20 },
]

export function LandingBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#2f55d4]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_7rem,rgb(255_255_255/0.035)_7rem_7.15rem)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgb(120_160_255/0.35),transparent_60%)]" />
      {DOODLES.map((doodle, i) => (
        <svg
          key={i}
          viewBox="0 0 40 40"
          className="absolute"
          style={{ left: doodle.x, top: doodle.y, width: doodle.size, height: doodle.size, transform: `rotate(${doodle.rotate}deg)` }}
        >
          <path d={doodle.d} fill="none" stroke="rgb(255 255 255 / 0.16)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}
