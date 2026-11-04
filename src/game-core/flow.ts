/**
 * Nhịp lượt chơi cho người + bot — dùng chung cho client offline và server online. Hàm thuần, có test.
 *
 * Không có luật chơi mới ở đây: mọi thứ suy ra từ `getLegalActions` (tức là từ reducer).
 * - `humanPrompt`: người chơi cần quyết định gì → UI hiện nút/popup tương ứng.
 * - `autoAction`: việc tự làm không cần hỏi (lượt của bot, hoặc bước hiển nhiên của người: đi quân,
 *   trả tiền thuê khi không có Lá Chắn, kết thúc lượt khi không còn gì để làm).
 */
import type { BotLevel } from '../config/bots'
import { chooseBotAction } from './bot'
import { currentPlayer } from './context'
import { getLegalActions } from './legalActions'
import type { GameAction, GameState, PlayerId } from './types'

type Of<K extends GameAction['type']> = Extract<GameAction, { type: K }>

export type HumanPrompt =
  | {
      kind: 'ROLL'
      /** Các ô bay tới được (có vé Sân Bay). */
      flyTiles: number[]
      onIsland: boolean
      canPayIslandFee: boolean
      canUseEscapeCard: boolean
    }
  | { kind: 'RENT_SHIELD'; tileIndex: number; amount: number; to: PlayerId }
  | { kind: 'SELL'; tiles: number[]; due: number }
  | { kind: 'DRAW_CARD' }
  | { kind: 'EARTHQUAKE'; tiles: number[] }
  | { kind: 'FESTIVAL'; tiles: number[] }
  | { kind: 'FREE_HOUSE'; tiles: number[] }
  | { kind: 'BUY'; tileIndex: number }
  | { kind: 'BUYOUT'; tileIndex: number }
  | { kind: 'BUILD'; tileIndex: number }

function legalOf<K extends GameAction['type']>(legal: GameAction[], type: K): Of<K>[] {
  return legal.filter((a): a is Of<K> => a.type === type)
}

const tilesOf = (actions: Array<{ tileIndex: number }>) => actions.map((a) => a.tileIndex)

/** Người chơi `humanId` cần quyết định gì lúc này? null = không phải lượt của họ, hoặc không có gì để hỏi. */
export function humanPrompt(state: GameState, humanId: PlayerId | null): HumanPrompt | null {
  if (state.phase !== 'playing' || humanId === null) return null
  const me = currentPlayer(state)
  if (me.id !== humanId) return null
  const legal = getLegalActions(state)
  const of = <K extends GameAction['type']>(type: K) => legalOf(legal, type)
  const pending = state.turn.pending

  switch (pending?.type) {
    case 'RENT':
      return of('USE_CARD').some((a) => a.card === 'SHIELD')
        ? { kind: 'RENT_SHIELD', tileIndex: pending.tileIndex, amount: pending.amount, to: pending.to }
        : null
    case 'DEBT':
      return { kind: 'SELL', tiles: tilesOf(of('SELL')), due: pending.payments.reduce((sum, p) => sum + p.amount, 0) }
    case 'DRAW_CARD':
      return { kind: 'DRAW_CARD' }
    case 'EARTHQUAKE':
      return { kind: 'EARTHQUAKE', tiles: tilesOf(of('EARTHQUAKE')) }
  }

  if (state.turn.step === 'ROLL') {
    return {
      kind: 'ROLL',
      flyTiles: tilesOf(of('FLY')),
      onIsland: me.islandTurnsLeft > 0,
      canPayIslandFee: of('PAY_ISLAND_FEE').length > 0,
      canUseEscapeCard: of('USE_CARD').some((a) => a.card === 'ESCAPE_ISLAND'),
    }
  }
  if (state.turn.step !== 'ACT') return null

  if (of('HOST_FESTIVAL').length > 0) return { kind: 'FESTIVAL', tiles: tilesOf(of('HOST_FESTIVAL')) }
  const builds = of('BUILD')
  if (state.turn.freeHouse && builds.length > 0) return { kind: 'FREE_HOUSE', tiles: tilesOf(builds) }
  if (of('BUY').length > 0) return { kind: 'BUY', tileIndex: me.position }
  if (of('BUYOUT').length > 0) return { kind: 'BUYOUT', tileIndex: me.position }
  if (builds.length > 0) return { kind: 'BUILD', tileIndex: builds[0].tileIndex }
  return null
}

/**
 * Việc tự làm cho người đang tới lượt. null = phải chờ người chơi quyết định.
 * `isHuman(id)`: người thật đang điều khiển ghế này (mất kết nối thì coi như bot).
 * `botLevel(id)`: mức bot cho ghế do máy chơi.
 */
export function autoAction(
  state: GameState,
  isHuman: (id: PlayerId) => boolean,
  botLevel: (id: PlayerId) => BotLevel = () => 'normal',
): GameAction | null {
  if (state.phase !== 'playing') return null
  const me = currentPlayer(state)
  if (!isHuman(me.id)) return chooseBotAction(state, botLevel(me.id))
  if (humanPrompt(state, me.id)) return null
  const legal = getLegalActions(state)
  const pick = (type: GameAction['type']) => legal.find((a) => a.type === type) ?? null
  // Không còn lựa chọn nào: đi quân, trả tiền thuê, hoặc kết thúc lượt.
  return pick('MOVE') ?? pick('PAY_RENT') ?? pick('END_TURN') ?? (legal.length === 1 ? legal[0] : null)
}

