/**
 * Các lựa chọn làm trực tiếp trên bàn cờ 3D: chọn ô cho Lễ Hội, nhà miễn phí, Động Đất. Bán tài sản khi thiếu tiền: bảng danh sách.
 * Bảng gợi ý nằm phía trên, ô chọn được sáng lên trên bàn cờ; bấm ô là gửi action.
 */
import { useMemo } from 'react'
import { BOARD, COLOR_GROUPS, RESORT_COLOR } from '../../config/board'
import { sellValue, type GameAction, type GameState } from '../../game-core'
import { useGameStore } from '../../store/gameStore'
import { autoSellPlan } from '../../store/match'
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
const LEVEL_LABEL = ['Đất trống', '1 nhà', '2 nhà', '3 nhà', 'Landmark']

/**
 * Thiếu tiền: bảng danh sách tài sản, bấm "Bán" ở từng ô (không phải chọn trên bàn cờ).
 * Mỗi lần chỉ gửi một lệnh, chờ server trả lời mới bấm tiếp được (tránh bán trùng khi chơi online).
 */
export function SellPanel({ game, tiles, due }: { game: GameState; tiles: number[]; due: number }) {
  const me = game.players[game.currentPlayerIndex]
  const awaiting = useGameStore((s) => s.awaitingServer)
  const short = Math.max(0, due - me.money)
  const rows = useMemo(
    () =>
      tiles
        .map((i) => ({ i, value: sellValue(game, i), level: game.tiles[i].level, kind: BOARD[i].kind }))
        .sort((a, b) => a.value - b.value),
    [game, tiles],
  )
  const autoSell = () => {
    const plan = autoSellPlan(game)
    if (plan.length > 0) act(...plan)
  }

  return (
    <Modal title="Bán tài sản trả nợ" ribbon="#f2437a" className="w-[30rem]">
      <div className="mb-[0.6rem] flex justify-center gap-[1.2rem] text-[1.05rem]">
        <span className="text-stone-500">
          Cần trả: <Money amount={due} className="font-extrabold text-ink" />
        </span>
        <span className="text-stone-500">
          Tiền mặt: <Money amount={me.money} className="font-extrabold text-ink" />
        </span>
        <span className="text-stone-500">
          Còn thiếu: <Money amount={short} className="font-extrabold text-rose-500" />
        </span>
      </div>
      <p className="mb-[0.5rem] text-center text-[0.95rem] text-stone-500">Bán cả ô (đất + nhà) cho ngân hàng. Đủ tiền thì tự trả nợ.</p>
      <ul className="flex max-h-[min(18rem,46vh)] flex-col gap-[0.35rem] overflow-y-auto pr-[0.2rem]">
        {rows.map(({ i, value, level, kind }) => {
          const color = BOARD[i].group ? COLOR_GROUPS.find((g) => g.id === BOARD[i].group)?.color : RESORT_COLOR
          const enough = me.money + value >= due
          return (
            <li key={i} className="flex items-center gap-[0.6rem] rounded-xl bg-white px-[0.7rem] py-[0.4rem] shadow-sm">
              <span className="h-[1.1rem] w-[1.1rem] shrink-0 rounded-full border-2 border-white shadow" style={{ background: color }} />
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <b className="truncate text-[1.05rem] text-ink">{BOARD[i].name}</b>
                <span className="text-[0.85rem] text-stone-400">{kind === 'RESORT' ? 'Khu Du Lịch' : LEVEL_LABEL[level]}</span>
              </span>
              <span className="text-[1.05rem] font-extrabold text-emerald-600">
                +<Money amount={value} />
              </span>
              <button
                className={`btn-3d ${enough ? 'btn-green' : 'btn-pink'} px-[0.9rem] py-[0.25rem] text-[1rem]`}
                disabled={awaiting}
                onClick={() => act({ type: 'SELL', playerId: me.id, tileIndex: i })}
              >
                Bán
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-[0.8rem] flex justify-center">
        <button className="btn-3d btn-blue px-[1.4rem] py-[0.4rem] text-[1.05rem]" disabled={awaiting} onClick={autoSell}>
          Bán tự động (ô rẻ nhất trước)
        </button>
      </div>
    </Modal>
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
