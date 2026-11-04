/**
 * Hiện đúng nút/popup cho quyết định hiện tại của người chơi (suy từ game-core qua `humanPrompt`).
 * Chỉ hiện khi hàng đợi animation đã trống, để popup không bật ra trước khi quân cờ tới nơi.
 */
import { useCallback, useMemo } from 'react'
import { BOARD } from '../../config/board'
import { ECONOMY } from '../../config/economy'
import { formatMoney, type GameState } from '../../game-core'
import { useIsAnimating } from '../../store/animationStore'
import { useGameStore } from '../../store/gameStore'
import { humanPrompt, type HumanPrompt } from '../../store/match'
import { useUiStore } from '../../store/uiStore'
import { act } from '../act'
import { TilePickPrompt, RentShieldPopup, SellPanel, HintPanel } from '../popups/BoardPrompts'
import { CardDeck } from '../popups/CardPopup'
import { BuyoutPopup, CityPopup, ResortPopup } from '../popups/PropertyPopup'
import { useBoardPick } from '../useBoardPick'

function RollButton({ playerId, label = 'TUNG XÚC XẮC' }: { playerId: string; label?: string }) {
  return (
    <button
      className="btn-3d btn-yellow flex items-center gap-[0.6rem] px-[2.6rem] py-[0.7rem] text-[1.8rem]"
      onClick={() => act({ type: 'ROLL_DICE', playerId })}
    >
      <span className="text-[1.9rem] leading-none">🎲</span>
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
      <div className="pointer-events-auto absolute bottom-[1.2rem] left-1/2 z-20 flex -translate-x-1/2 items-end gap-[0.8rem] whitespace-nowrap">
        {prompt.canUseEscapeCard && (
          <button
            className="btn-3d btn-green px-[1.2rem] py-[0.5rem] text-[1.15rem]"
            onClick={() => act({ type: 'USE_CARD', playerId: me.id, card: 'ESCAPE_ISLAND' })}
          >
            🏝️ Dùng thẻ Ra Đảo
          </button>
        )}
        <RollButton playerId={me.id} label={prompt.onIsland ? 'TUNG (CẦN ĐÔI)' : 'TUNG XÚC XẮC'} />
        {prompt.canPayIslandFee && (
          <button
            className="btn-3d btn-blue px-[1.2rem] py-[0.5rem] text-[1.15rem]"
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
          hint="Bấm một thành phố của bạn để tổ chức Lễ Hội (tiền thuê x2)"
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
  const prompt = useMemo(
    () => (game && !animating && !autoplay ? humanPrompt(game, humanId) : null),
    [game, animating, autoplay, humanId],
  )
  if (!game || !prompt || card) return null
  // key: mỗi quyết định mới dựng popup mới (chọn cấp nhà… bắt đầu lại từ đầu).
  return <PromptView key={`${actionCount}-${prompt.kind}`} game={game} prompt={prompt} />
}
