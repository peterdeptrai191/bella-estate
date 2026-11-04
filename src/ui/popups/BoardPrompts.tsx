/**
 * Các lựa chọn làm trực tiếp trên bàn cờ 3D: chọn ô cho Lễ Hội, nhà miễn phí, Động Đất; bán tài sản khi thiếu tiền.
 * Bảng gợi ý nằm phía trên, ô chọn được sáng lên trên bàn cờ; bấm ô là gửi action.
 */
import { useMemo, useState } from 'react'
import { BOARD } from '../../config/board'
import { formatMoney, getTimeoutAction, sellValue, type GameAction, type GameState } from '../../game-core'
import { useGameStore } from '../../store/gameStore'
import type { BoardPick } from '../../store/uiStore'
import { act } from '../act'
import { Modal, Money } from '../kit'
import { useBoardPick } from '../useBoardPick'

/** Bảng nhỏ phía trên bàn cờ (không che bàn cờ, không chặn bấm ô). */
export function HintPanel({ title, children, tone = 'blue' }: { title: string; children?: React.ReactNode; tone?: 'blue' | 'pink' }) {
  return (
    <div className="animate-pop-in pointer-events-auto absolute top-[5.6rem] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-[0.5rem] rounded-[1.4rem] bg-cream/95 px-[1.4rem] pt-[0.6rem] pb-[0.9rem] text-center shadow-xl">
      <div
        className={`-mt-[1.3rem] rounded-xl px-[1.2rem] py-[0.25rem] text-[1.2rem] font-extrabold whitespace-nowrap text-white uppercase shadow-md ${
          tone === 'pink' ? 'bg-[#f2437a]' : 'bg-[#2fa7e6]'
        }`}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

export function TilePickPrompt({
  title,
  hint,
  tiles,
  makeAction,
  skip,
  skipLabel = 'Bỏ qua',
  tone,
}: {
  title: string
  hint: string
  tiles: number[]
  makeAction: (tileIndex: number) => GameAction
  skip?: GameAction
  skipLabel?: string
  tone?: 'good' | 'bad'
}) {
  const pick = useMemo<BoardPick>(() => ({ tiles, onPick: (i) => act(makeAction(i)), tone }), [tiles, makeAction, tone])
  useBoardPick(pick)
  return (
    <HintPanel title={title} tone={tone === 'bad' ? 'pink' : 'blue'}>
      <div className="text-[1.05rem] font-semibold text-stone-600">{hint}</div>
      {skip && (
        <button className="btn-3d btn-gray px-[1.4rem] py-[0.35rem] text-[1.05rem]" onClick={() => act(skip)}>
          {skipLabel}
        </button>
      )}
    </HintPanel>
  )
}

/** Thiếu tiền: chọn ô trên bàn cờ để bán (hiện giá bán trên từng ô), hoặc bán tự động. */
export function SellPanel({ game, tiles, due }: { game: GameState; tiles: number[]; due: number }) {
  const me = game.players[game.currentPlayerIndex]
  const [selected, setSelected] = useState<number | null>(null)
  const chosen = selected !== null && tiles.includes(selected) ? selected : null
  const labels = useMemo(() => Object.fromEntries(tiles.map((i) => [i, formatMoney(sellValue(game, i))])), [game, tiles])
  const pick = useMemo<BoardPick>(
    () => ({ tiles, onPick: setSelected, labels, selected: chosen, tone: 'bad' }),
    [tiles, labels, chosen],
  )
  useBoardPick(pick)

  const autoSell = () => {
    // Mỗi bước dùng đúng lựa chọn mặc định của game-core (bán ô rẻ nhất) cho tới khi hết nợ.
    for (let guard = 0; guard < 40; guard++) {
      const state = useGameStore.getState().game
      if (!state || state.turn.pending?.type !== 'DEBT') return
      const action = getTimeoutAction(state)
      if (!action || action.type !== 'SELL') return
      act(action)
    }
  }

  return (
    <HintPanel title="Bán tài sản" tone="pink">
      <div className="text-[1.05rem] font-semibold text-stone-600">Chọn một ô của bạn trên bàn cờ để bán cho ngân hàng</div>
      <div className="flex gap-[1.2rem] text-[1.05rem]">
        <span className="text-stone-500">
          Cần trả: <Money amount={due} className="font-extrabold text-ink" />
        </span>
        <span className="text-stone-500">
          Còn thiếu: <Money amount={Math.max(0, due - me.money)} className="font-extrabold text-rose-500" />
        </span>
      </div>
      <div className="flex gap-[0.7rem]">
        <button className="btn-3d btn-blue px-[1.2rem] py-[0.35rem] text-[1.05rem]" onClick={autoSell}>
          Bán tự động
        </button>
        <button
          className="btn-3d btn-pink px-[1.4rem] py-[0.35rem] text-[1.05rem]"
          disabled={chosen === null}
          onClick={() => chosen !== null && act({ type: 'SELL', playerId: me.id, tileIndex: chosen })}
        >
          {chosen === null ? 'Bán' : `Bán ${BOARD[chosen].name} · ${formatMoney(sellValue(game, chosen))}`}
        </button>
      </div>
    </HintPanel>
  )
}

export function RentShieldPopup({ game, tileIndex, amount, to }: { game: GameState; tileIndex: number; amount: number; to: string }) {
  const me = game.players[game.currentPlayerIndex]
  const owner = game.players.find((p) => p.id === to)
  return (
    <Modal title="Tiền thuê" ribbon="#f2437a" className="w-[26rem]">
      <p className="text-center text-[1.15rem] text-stone-600">
        Bạn dừng ở <b className="text-ink">{BOARD[tileIndex].name}</b> của <b className="text-ink">{owner?.name}</b>
      </p>
      <div className="my-[0.6rem] text-center text-[2rem] font-extrabold text-rose-500">
        <Money amount={amount} />
      </div>
      <p className="text-center text-[1rem] text-stone-500">Bạn đang giữ thẻ 🛡️ Lá Chắn — dùng để miễn khoản này?</p>
      <div className="mt-[0.9rem] flex justify-center gap-[0.8rem]">
        <button className="btn-3d btn-gray px-[1.4rem] py-[0.45rem] text-[1.1rem]" onClick={() => act({ type: 'PAY_RENT', playerId: me.id })}>
          Trả tiền
        </button>
        <button
          className="btn-3d btn-green px-[1.6rem] py-[0.45rem] text-[1.15rem]"
          onClick={() => act({ type: 'USE_CARD', playerId: me.id, card: 'SHIELD' })}
        >
          🛡️ Dùng Lá Chắn
        </button>
      </div>
    </Modal>
  )
}
