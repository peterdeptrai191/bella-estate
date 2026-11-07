/** Số điểm vừa tung, nổi phía trên hai viên xúc xắc (giữa bàn cờ). */
import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { diceRestPositions } from './boardLayout'

export function DiceTotal() {
  const visual = useVisual()
  const shown = useUiStore((s) => s.diceShown)
  const pos = useMemo((): [number, number, number] => {
    const [a, b] = diceRestPositions(visual)
    return [(a[0] + b[0]) / 2, a[1] + visual.dice.size * visual.dice.totalLift, (a[2] + b[2]) / 2]
  }, [visual])
  if (!shown) return null
  const double = shown.dice[0] === shown.dice[1]
  return (
    <Html position={pos} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div key={`${shown.dice[0]}-${shown.dice[1]}-${shown.total}`} className="animate-pop-in flex flex-col items-center select-none">
        <div
          className={`flex h-[3.4rem] min-w-[3.4rem] items-center justify-center rounded-full border-[0.25rem] border-white px-[0.6rem] text-[2.1rem] leading-none font-extrabold text-white shadow-lg ${double ? 'bg-pink-500' : 'bg-sky-500'}`}
        >
          {shown.total}
        </div>
        <div className="mt-[0.2rem] rounded-full bg-white/90 px-[0.6rem] text-[0.95rem] font-extrabold whitespace-nowrap text-ink shadow">
          {shown.dice[0]} + {shown.dice[1]}
          {double ? ' · ĐÔI' : ''}
        </div>
      </div>
    </Html>
  )
}
