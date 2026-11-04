/** Thẻ Cơ Hội: bộ bài úp để rút, và thẻ lật 3D khi rút xong (cả bot lẫn người). */
import { useEffect, useState } from 'react'
import { CARDS, type CardId } from '../../config/cards'
import { useAnimationStore } from '../../store/animationStore'
import { useUiStore } from '../../store/uiStore'
import { useVisual } from '../../store/visualStore'
import { act } from '../act'

/** Biểu tượng và màu của từng thẻ (chỉ là trình bày). */
const CARD_LOOK: Record<CardId, { icon: string; good: boolean }> = {
  ESCAPE_ISLAND: { icon: '🏝️', good: true },
  DISCOUNT: { icon: '🏷️', good: true },
  SHIELD: { icon: '🛡️', good: true },
  GO_TO_START: { icon: '🏁', good: true },
  GO_TO_FESTIVAL: { icon: '🎉', good: true },
  EARTHQUAKE: { icon: '🌋', good: true },
  GO_TO_ISLAND: { icon: '⛵', good: false },
  SURPRISE_TAX: { icon: '💸', good: false },
  CHARITY: { icon: '🎁', good: false },
  LOTTERY: { icon: '🎰', good: true },
}

function CardBack() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.4rem] border-[0.35rem] border-white bg-[repeating-linear-gradient(45deg,#2fa7e6_0_0.8rem,#45b4ec_0.8rem_1.6rem)] shadow-xl backface-hidden">
      <span className="flex h-[6rem] w-[6rem] items-center justify-center rounded-full bg-white text-[4rem] font-extrabold text-sky-500 shadow-inner">
        ?
      </span>
      <span className="mt-[0.8rem] rounded-full bg-white/90 px-[1rem] text-[1.2rem] font-extrabold tracking-wider text-sky-600">CƠ HỘI</span>
    </div>
  )
}

function CardFront({ card }: { card: CardId }) {
  const look = CARD_LOOK[card]
  return (
    <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col overflow-hidden rounded-[1.4rem] border-[0.35rem] border-white bg-cream shadow-xl backface-hidden">
      <div
        className={`py-[0.5rem] text-center text-[1.1rem] font-extrabold tracking-wider text-white ${look.good ? 'bg-emerald-500' : 'bg-rose-500'}`}
      >
        CƠ HỘI
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-[1rem] text-center">
        <span className="text-[4.2rem] leading-none drop-shadow">{look.icon}</span>
        <span className="mt-[0.6rem] text-[1.6rem] leading-tight font-extrabold text-ink">{CARDS[card].name}</span>
        <span className="mt-[0.4rem] text-[1.05rem] leading-snug text-stone-500">{CARDS[card].description}</span>
      </div>
    </div>
  )
}

/** Thẻ vừa rút: lật từ mặt sau sang mặt trước. */
export function CardReveal() {
  const reveal = useUiStore((s) => s.card)
  const closeCard = useUiStore((s) => s.closeCard)
  const { animation } = useVisual()
  const name = useAnimationStore((s) => s.view?.players.find((p) => p.id === reveal?.playerId)?.name)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (!reveal) return
    const timer = setTimeout(() => setFlipped(true), 120)
    return () => {
      clearTimeout(timer)
      setFlipped(false)
    }
  }, [reveal])

  if (!reveal) return null
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1d3b5a]/45" onClick={reveal.interactive ? closeCard : undefined}>
      {!reveal.interactive && <div className="mb-[0.8rem] text-[1.3rem] font-extrabold text-white drop-shadow">{name} rút thẻ</div>}
      <div className="animate-pop-in perspective-card">
        <div
          className="relative h-[19rem] w-[13.5rem] preserve-3d"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: `transform ${animation.cardFlipDuration}s cubic-bezier(0.3, 1.4, 0.5, 1)`,
          }}
        >
          <CardBack />
          <CardFront card={reveal.card} />
        </div>
      </div>
      {reveal.interactive && (
        <button className="btn-3d btn-blue mt-[1.4rem] px-[3rem] py-[0.5rem] text-[1.3rem]" onClick={closeCard}>
          OK
        </button>
      )}
    </div>
  )
}

/** Người chơi dừng ở ô Cơ Hội: chạm bộ bài để rút. */
export function CardDeck({ playerId }: { playerId: string }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1d3b5a]/45">
      <div className="mb-[1rem] text-[1.5rem] font-extrabold text-white drop-shadow">Ô Cơ Hội — rút một thẻ!</div>
      <button
        className="animate-bounce-soft relative h-[19rem] w-[13.5rem] cursor-pointer"
        onClick={() => act({ type: 'DRAW_CARD', playerId })}
        aria-label="Rút thẻ Cơ Hội"
      >
        <span className="absolute inset-0 translate-x-[0.6rem] translate-y-[0.6rem] rounded-[1.4rem] bg-sky-700/60" />
        <span className="absolute inset-0 translate-x-[0.3rem] translate-y-[0.3rem] rounded-[1.4rem] bg-sky-600/70" />
        <CardBack />
      </button>
      <div className="mt-[1.2rem] text-[1.1rem] font-bold text-white/90">Chạm vào bộ bài</div>
    </div>
  )
}
