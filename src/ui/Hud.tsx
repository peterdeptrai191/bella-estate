/**
 * Giao diện 2D đè lên bàn cờ 3D: 4 khung người chơi ở 4 góc, thanh trên cùng, nút/popup cho quyết định
 * hiện tại, thẻ Cơ Hội, thông tin ô, chữ lớn và màn hình kết quả.
 * Tiền/lượt hiển thị theo view (đi cùng animation); quyết định lấy từ game-core qua store.
 */
import { useEffect } from 'react'
import { useAnimationStore } from '../store/animationStore'
import { useGameStore } from '../store/gameStore'
import { startMatchDriver } from '../store/matchDriver'
import { useUiStore } from '../store/uiStore'
import { PlayerPanel } from './hud/PlayerPanel'
import { Banners, ResultModal, TopBar } from './hud/Overlays'
import { PromptLayer } from './hud/PromptLayer'
import { exitToMenu, playAgain } from './matchSetup'
import { CardReveal } from './popups/CardPopup'
import { TileInfo } from './popups/TileInfo'

function WaitingPill() {
  const view = useAnimationStore((s) => s.view)
  const humanId = useGameStore((s) => s.humanId)
  const autoplay = useUiStore((s) => s.autoplayHuman)
  const current = view?.players.find((p) => p.id === view.currentPlayerId)
  if (!view || view.winner || !current || (current.id === humanId && !autoplay)) return null
  return (
    <div className="pointer-events-none absolute bottom-[1.6rem] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/85 px-[1.2rem] py-[0.3rem] text-[1.1rem] font-bold text-stone-500 shadow">
      Lượt của {current.name}…
    </div>
  )
}

export function Hud() {
  const view = useAnimationStore((s) => s.view)
  const game = useGameStore((s) => s.game)
  const humanId = useGameStore((s) => s.humanId)
  const deadline = useUiStore((s) => s.deadline)
  const seats = useGameStore((s) => s.seats)

  useEffect(() => startMatchDriver(), [])

  if (!view || !game) return null
  const isBotSeat = (id: string) => seats[id]?.kind === 'bot'
  // Người chơi trên máy này luôn ở góc dưới trái; các ghế khác xếp theo chiều kim đồng hồ.
  const localSeat = Math.max(0, view.players.findIndex((p) => p.id === humanId))
  return (
    <div className="safe-area pointer-events-none absolute overflow-hidden select-none">
      {view.players.map((p) => (
        <PlayerPanel
          key={p.id}
          player={p}
          corner={(p.seat - localSeat + 4) % 4}
          active={p.id === view.currentPlayerId && !view.winner}
          isYou={p.id === humanId}
          isBot={isBotSeat(p.id)}
          offline={seats[p.id]?.connected === false}
          deadline={deadline?.playerId === p.id ? deadline : null}
        />
      ))}
      <TopBar />
      <WaitingPill />
      <PromptLayer />
      <Banners />
      <CardReveal />
      <TileInfo />
      <ResultModal onRestart={playAgain} onMenu={() => void exitToMenu()} />
    </div>
  )
}
