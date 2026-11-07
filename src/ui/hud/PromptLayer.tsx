/**
 * Hiện đúng nút/popup cho quyết định hiện tại của người chơi (suy từ game-core qua `humanPrompt`).
 * Chỉ hiện khi hàng đợi animation đã trống, để popup không bật ra trước khi quân cờ tới nơi.
 */
import { useCallback, useMemo } from 'react'
import { BOARD } from '../../config/board'
import { ECONOMY } from '../../config/economy'
import { festivalMultiplier, formatMoney, humanPrompt, type GameState, type HumanPrompt } from '../../game-core'
import { useIsAnimating } from '../../store/animationStore'
import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { act } from '../act'
import { TilePickPrompt, RentShieldPopup, SellPanel, HintPanel } from '../popups/BoardPrompts'
import { CardDeck } from '../popups/CardPopup'
import { BuyoutPopup, CityPopup, ResortPopup } from '../popups/PropertyPopup'
import { useBoardPick } from '../useBoardPick'
import { useBotTakeover } from '../useBotTakeover'

function RollButton({ playerId, label = 'TUNG XÚC XẮC' }: { playerId: string; label?: string }) {
  return (
    <button
      className="btn-3d btn-yellow animate-pop-in flex items-center gap-[0.5rem] px-[1.6rem] py-[0.5rem] text-[1.4rem] portrait:px-[1rem] portrait:py-[0.35rem] portrait:text-[1.1rem]"
      onClick={() => act({ type: 'ROLL_DICE', playerId })}
    >
      <span className="text-[1.5rem] leading-none">🎲</span>
      {label}
    </button>
  )
}

function RollBar({ game, prompt }: { game: GameState; prompt: Extract<HumanPrompt, { kind: 'ROLL' }> }) {
  const me = game.players[game.currentPlayerIndex]
  const fly = useCallback((tileIndex: number) => act({ type: 'FLY', playerId: me.id, tileIndex }), [me.id])
  const pick = useMemo(
    () => (prompt.flyTiles.length > 0 ? { tiles: prompt.flyTiles, onPick: fly, tone: 'good' as const } : null),
    [prompt.flyTiles, fly],
  )
  useBoardPick(pick)
  // Đặt nút ngay dưới xúc xắc ở giữa bàn cờ (theo camera); chưa đo được thì để giữa màn hình.
  const center = useUiStore((s) => s.boardCenter)
  const anchor = center
    ? { left: `calc(${center.x}px - env(safe-area-inset-left, 0px))`, top: `calc(${center.y}px - env(safe-area-inset-top, 0px) + 2.4rem)` }
    : { left: '50%', top: 'calc(50% + 2.4rem)' }

  return (
    <>
      {prompt.onIsland && (
        <HintPanel title="Đảo Hoang">
          <div className="text-[1.05rem] font-semibold text-stone-600">
            Tung ra đôi để thoát (còn tối đa {me.islandTurnsLeft} lượt)
          </div>
        </HintPanel>
      )}
      {prompt.flyTiles.length > 0 && (
        <HintPanel title="Sân Bay">
          <div className="text-[1.05rem] font-semibold text-stone-600">
            Bấm một ô trên bàn cờ để bay tới (phí {formatMoney(ECONOMY.airport.flightFee)}) — hoặc tung xúc xắc
          </div>
        </HintPanel>
      )}
      <div className="pointer-events-auto absolute z-20 flex -translate-x-1/2 flex-col items-center gap-[0.45rem] whitespace-nowrap" style={anchor}>
        <RollButton playerId={me.id} label={prompt.onIsland ? 'TUNG (CẦN ĐÔI)' : 'TUNG XÚC XẮC'} />
        {prompt.canUseEscapeCard && (
          <button
            className="btn-3d btn-green px-[1rem] py-[0.3rem] text-[1rem]"
            onClick={() => act({ type: 'USE_CARD', playerId: me.id, card: 'ESCAPE_ISLAND' })}
          >
            🏝️ Dùng thẻ Ra Đảo
          </button>
        )}
        {prompt.canPayIslandFee && (
          <button
            className="btn-3d btn-blue px-[1rem] py-[0.3rem] text-[1rem]"
            onClick={() => act({ type: 'PAY_ISLAND_FEE', playerId: me.id })}
          >
            Trả {formatMoney(ECONOMY.island.escapeFee)} thoát đảo
          </button>
        )}
      </div>
    </>
  )
}

function PromptView({ game, prompt }: { game: GameState; prompt: HumanPrompt }) {
  const me = game.players[game.currentPlayerIndex]
  const endTurn = useMemo(() => ({ type: 'END_TURN', playerId: me.id }) as const, [me.id])
  const festival = useCallback((tileIndex: number) => ({ type: 'HOST_FESTIVAL', playerId: me.id, tileIndex }) as const, [me.id])
  const build = useCallback((tileIndex: number) => ({ type: 'BUILD', playerId: me.id, tileIndex }) as const, [me.id])
  const quake = useCallback((tileIndex: number) => ({ type: 'EARTHQUAKE', playerId: me.id, tileIndex }) as const, [me.id])

  switch (prompt.kind) {
    case 'ROLL':
      return <RollBar game={game} prompt={prompt} />
    case 'BUY':
      return BOARD[prompt.tileIndex].kind === 'RESORT' ? (
        <ResortPopup game={game} tileIndex={prompt.tileIndex} />
      ) : (
        <CityPopup game={game} tileIndex={prompt.tileIndex} mode="BUY" />
      )
    case 'BUILD':
      return <CityPopup game={game} tileIndex={prompt.tileIndex} mode="BUILD" />
    case 'BUYOUT':
      return <BuyoutPopup game={game} tileIndex={prompt.tileIndex} />
    case 'DRAW_CARD':
      return <CardDeck playerId={me.id} />
    case 'RENT_SHIELD':
      return <RentShieldPopup game={game} tileIndex={prompt.tileIndex} amount={prompt.amount} to={prompt.to} />
    case 'SELL':
      return <SellPanel game={game} tiles={prompt.tiles} due={prompt.due} />
    case 'FESTIVAL':
      return (
        <TilePickPrompt
          title="Lễ Hội"
          hint={`Bấm một thành phố của bạn để tổ chức Lễ Hội (tiền thuê x${festivalMultiplier((game.festivalCount || 0) + 1)})`}
          tiles={prompt.tiles}
          makeAction={festival}
          skip={endTurn}
          tone="good"
        />
      )
    case 'FREE_HOUSE':
      return (
        <TilePickPrompt
          title="Nhà miễn phí"
          hint="Dừng đúng Xuất Phát! Bấm một thành phố của bạn để xây 1 nhà miễn phí"
          tiles={prompt.tiles}
          makeAction={build}
          skip={endTurn}
          tone="good"
        />
      )
    case 'EARTHQUAKE':
      return (
        <TilePickPrompt
          title="Động Đất"
          hint="Bấm một thành phố có nhà của đối thủ để phá 1 nhà"
          tiles={prompt.tiles}
          makeAction={quake}
          tone="bad"
        />
      )
  }
}

export function PromptLayer() {
  const game = useGameStore((s) => s.game)
  const humanId = useGameStore((s) => s.humanId)
  const actionCount = useGameStore((s) => s.actionCount)
  const autoplay = useUiStore((s) => s.autoplayHuman)
  const animating = useIsAnimating()
  const card = useUiStore((s) => s.card)
  const awaiting = useGameStore((s) => s.awaitingServer)
  // Online: bot đang chơi thay ghế của mình thì không hiện nút (bấm "Tắt bot" trước).
  const takeover = useBotTakeover()
  const prompt = useMemo(
    () => (game && !animating && !autoplay && !takeover ? humanPrompt(game, humanId) : null),
    [game, animating, autoplay, takeover, humanId],
  )
  if (!game || !prompt || card || awaiting) return null
  // key: mỗi quyết định mới dựng popup mới (chọn cấp nhà… bắt đầu lại từ đầu).
  return <PromptView key={`${actionCount}-${prompt.kind}`} game={game} prompt={prompt} />
}
