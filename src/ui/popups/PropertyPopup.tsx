/** Popup Mua đất (chọn luôn số nhà), Xây nhà (chọn cấp) và Mua lại (hiện giá). */
import { useState } from 'react'
import { BOARD, COLOR_GROUPS } from '../../config/board'
import { buyoutPrice, LANDMARK_LEVEL, rentFor, type GameState, type PlayerId } from '../../game-core'
import { levelOptions, previewAfter, type LevelOption } from '../../store/match'
import { useSeatSkin } from '../../store/gameStore'
import { useVisual } from '../../store/visualStore'
import { act } from '../act'
import { LevelIcon, Modal, Money } from '../kit'

const LEVEL_NAMES = ['Đất', 'Nhà 1', 'Nhà 2', 'Nhà 3', 'Landmark']

function groupColor(tileIndex: number): string | undefined {
  const group = BOARD[tileIndex].group
  return COLOR_GROUPS.find((g) => g.id === group)?.color
}

function seatColor(game: GameState, id: PlayerId | null, colors: readonly string[]): string {
  const seat = game.players.findIndex((p) => p.id === id)
  return colors[Math.max(0, seat) % colors.length]
}

function TileTitle({ tileIndex }: { tileIndex: number }) {
  const color = groupColor(tileIndex)
  return (
    <span className="inline-flex items-center gap-[0.5rem]">
      {color && <span className="h-[1rem] w-[1rem] rounded-full border-2 border-white" style={{ background: color }} />}
      {BOARD[tileIndex].name}
    </span>
  )
}

function LevelCard({
  level,
  state,
  color,
  onSelect,
}: {
  level: number
  state: 'owned' | 'selected' | 'available' | 'locked'
  color: string
  onSelect: () => void
}) {
  const checked = state === 'owned' || state === 'selected'
  return (
    <button
      disabled={state === 'locked' || state === 'owned'}
      onClick={onSelect}
      className={`flex flex-1 flex-col items-center rounded-xl border-[0.15rem] bg-white px-[0.3rem] pt-[0.3rem] pb-[0.4rem] shadow-sm transition ${
        state === 'selected' ? 'border-sky-400 -translate-y-[0.2rem] shadow-md' : 'border-transparent'
      } ${state === 'locked' ? 'opacity-40' : ''} ${state === 'available' ? 'hover:-translate-y-[0.15rem] hover:shadow-md' : ''}`}
    >
      <span className="block w-full rounded-lg bg-gradient-to-b from-sky-100 to-white">
        <LevelIcon level={level} color={color} className="h-[4.2rem] w-full" />
      </span>
      <span className="mt-[0.2rem] flex items-center gap-[0.3rem] text-[1rem] font-bold text-ink">
        {LEVEL_NAMES[level]}
        <span
          className={`flex h-[1rem] w-[1rem] items-center justify-center rounded-[0.25rem] border-2 text-[0.75rem] leading-none ${
            checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 bg-white'
          }`}
        >
          {checked ? '✓' : ''}
        </span>
      </span>
    </button>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-[0.4rem] text-[1.1rem] text-stone-500">
      {label}
      <span className="font-extrabold text-ink">{children}</span>
    </div>
  )
}

/** Mua đất hoặc xây nhà trên thành phố: chọn cấp muốn đạt, xem trước tiền thuê và giá đối thủ mua lại. */
export function CityPopup({ game, tileIndex, mode }: { game: GameState; tileIndex: number; mode: 'BUY' | 'BUILD' }) {
  const { playerColors } = useVisual()
  const me = game.players[game.currentPlayerIndex]
  const color = seatColor(game, me.id, playerColors)
  const options = levelOptions(game, tileIndex, mode === 'BUY')
  const current = game.tiles[tileIndex].level
  const [selected, setSelected] = useState<number>(options[0]?.level ?? current)
  const chosen: LevelOption | undefined = options.find((o) => o.level === selected) ?? options[0]
  const after = chosen ? previewAfter(game, chosen.actions) : null
  const levels = mode === 'BUY' ? [0, 1, 2, 3] : [1, 2, 3, LANDMARK_LEVEL]
  const endTurn = { type: 'END_TURN', playerId: me.id } as const

  return (
    <Modal title={<TileTitle tileIndex={tileIndex} />} onClose={() => act(endTurn)} className="w-[34rem]">
      <div className="flex gap-[0.6rem]">
        {levels.map((level) => (
          <LevelCard
            key={level}
            level={level}
            color={color}
            state={
              mode === 'BUILD' && level <= current
                ? 'owned'
                : level === selected || (level < selected && (mode === 'BUY' || level > current))
                  ? 'selected'
                  : options.some((o) => o.level === level)
                    ? 'available'
                    : 'locked'
            }
            onSelect={() => setSelected(level)}
          />
        ))}
      </div>
      <div className="mt-[1rem] flex flex-col gap-[0.5rem]">
        {after && (
          <Line label="Tiền thuê:">
            <Money amount={rentFor(after, tileIndex)} />
          </Line>
        )}
        {chosen ? (
          <button
            className="btn-3d btn-blue mx-auto mt-[0.2rem] px-[2.4rem] py-[0.55rem] text-[1.35rem]"
            onClick={() => act(...chosen.actions, endTurn)}
          >
            {mode === 'BUY' ? 'MUA VỚI GIÁ' : 'XÂY VỚI GIÁ'} <Money amount={chosen.cost} />
          </button>
        ) : (
          <div className="text-center font-bold text-rose-500">Không đủ tiền</div>
        )}
        {after && (
          <Line label="Đối thủ có thể mua lại với giá:">
            <Money amount={buyoutPrice(after, tileIndex)} />
          </Line>
        )}
        <p className="text-center text-[0.9rem] text-stone-400">
          Landmark: <b>{BOARD[tileIndex].landmark}</b>
          {mode === 'BUY' && ' · xây được từ lần dừng sau'}
        </p>
      </div>
    </Modal>
  )
}

export function ResortPopup({ game, tileIndex }: { game: GameState; tileIndex: number }) {
  const me = game.players[game.currentPlayerIndex]
  const buy = { type: 'BUY', playerId: me.id } as const
  const endTurn = { type: 'END_TURN', playerId: me.id } as const
  const after = previewAfter(game, [buy])
  const price = BOARD[tileIndex].price ?? 0
  return (
    <Modal title={BOARD[tileIndex].name} onClose={() => act(endTurn)} className="w-[24rem]">
      <div className="mx-auto w-[11rem] rounded-xl bg-gradient-to-b from-sky-100 to-white">
        <LevelIcon level={-1} color="#ff8fab" className="h-[7rem] w-full" />
      </div>
      <p className="mt-[0.3rem] text-center text-[1rem] text-stone-500">Tiền thuê tăng theo số Khu Du Lịch bạn sở hữu.</p>
      <div className="mt-[0.6rem] flex flex-col gap-[0.5rem]">
        {after && (
          <Line label="Tiền thuê:">
            <Money amount={rentFor(after, tileIndex)} />
          </Line>
        )}
        <button className="btn-3d btn-blue mx-auto px-[2.4rem] py-[0.55rem] text-[1.35rem]" onClick={() => act(buy, endTurn)}>
          MUA VỚI GIÁ <Money amount={price} />
        </button>
      </div>
    </Modal>
  )
}

export function BuyoutPopup({ game, tileIndex }: { game: GameState; tileIndex: number }) {
  const { playerColors } = useVisual()
  const me = game.players[game.currentPlayerIndex]
  const tile = game.tiles[tileIndex]
  const ownerSeat = game.players.findIndex((p) => p.id === tile.owner)
  const owner = game.players[ownerSeat]
  const color = playerColors[ownerSeat % playerColors.length]
  const ownerSkin = useSeatSkin(tile.owner, ownerSeat)
  const price = buyoutPrice(game, tileIndex)
  const isResort = BOARD[tileIndex].kind === 'RESORT'
  const endTurn = { type: 'END_TURN', playerId: me.id } as const
  return (
    <Modal title="Mua lại" ribbon="#f2437a" onClose={() => act(endTurn)} className="w-[28rem]">
      <div className="flex items-center gap-[1rem]">
        <div className="w-[10rem] shrink-0 rounded-xl bg-gradient-to-b from-sky-100 to-white">
          <LevelIcon level={isResort ? -1 : tile.level} color={color} className="h-[6.5rem] w-full" />
        </div>
        <div className="flex flex-col gap-[0.2rem]">
          <div className="text-[1.4rem] leading-tight font-extrabold">
            <TileTitle tileIndex={tileIndex} />
          </div>
          <div className="flex items-center gap-[0.4rem] text-[1.05rem] text-stone-500">
            Chủ:
            <img src={ownerSkin.avatar} alt="" className="h-[1.6rem] w-[1.6rem] rounded-full" style={{ background: color }} />
            <span className="font-bold" style={{ color }}>
              {owner?.name}
            </span>
          </div>
          <div className="text-[1rem] text-stone-500">
            {isResort ? 'Khu Du Lịch' : LEVEL_NAMES[tile.level]} · thuê <Money amount={rentFor(game, tileIndex)} className="font-bold text-ink" />
          </div>
        </div>
      </div>
      <p className="mt-[0.7rem] text-center text-[1rem] text-stone-500">Mua lại xong bạn có thể xây thêm nhà ngay.</p>
      <div className="mt-[0.6rem] flex items-center justify-center gap-[0.8rem]">
        <button className="btn-3d btn-gray px-[1.4rem] py-[0.5rem] text-[1.1rem]" onClick={() => act(endTurn)}>
          Bỏ qua
        </button>
        <button
          className="btn-3d btn-pink px-[1.8rem] py-[0.55rem] text-[1.3rem]"
          onClick={() => act({ type: 'BUYOUT', playerId: me.id })}
        >
          MUA LẠI <Money amount={price} />
        </button>
      </div>
    </Modal>
  )
}
