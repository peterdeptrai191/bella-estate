import { create } from 'zustand'
import type { BotLevel } from '../config/bots'
import { SEAT_SKINS, skinById, type SkinDef } from '../config/skins'
import { applyAction, createGame, type GameAction, type GameEvent, type GameState, type PlayerId } from '../game-core'
import type { IntentAction, SeatInfo } from '../net/protocol'
import { useAnimationStore } from './animationStore'

/**
 * Store nối game-core với UI/scene. Store chỉ gọi hàm của game-core và lưu kết quả —
 * không tự viết luật chơi. Event của mỗi action được đẩy sang hàng đợi animation;
 * state game-core cập nhật ngay, không chờ animation.
 *
 * - offline: áp action ngay trên máy (bot chạy ở matchDriver).
 * - online: gửi ý định lên server; state/event chỉ đến từ server (`loadRemote` / `applyRemote`).
 */
export interface SeatMeta {
  name: string
  skin: string
  kind: 'human' | 'bot'
  connected: boolean
  botLevel: BotLevel
}

export interface OfflineConfig {
  name: string
  skin: string
  bots: number
  level: BotLevel
}

interface GameStore {
  game: GameState | null
  mode: 'offline' | 'online'
  /** Người chơi điều khiển trên máy này (null = chỉ xem). */
  humanId: PlayerId | null
  /** Thông tin hiển thị từng ghế: skin, người/bot, kết nối. */
  seats: Record<PlayerId, SeatMeta>
  /** Định danh ván (để nhận thưởng một lần). */
  matchId: string
  /** Tăng sau mỗi lần state đổi — dùng để biết đã sang một quyết định mới. */
  actionCount: number
  /** Online: đã gửi ý định, đang chờ server trả lời (ẩn popup để không bấm trùng). */
  awaitingServer: boolean
  offlineConfig: OfflineConfig | null
  /** Hàm gửi ý định lên server (do store/net.ts gắn vào khi vào phòng). */
  /** Online: gửi một lần bấm (một hoặc nhiều ý định, server áp theo đúng thứ tự trong một yêu cầu). */
  sendIntent: ((actions: IntentAction[]) => void) | null

  startOffline: (config: OfflineConfig, seed?: number | string) => void
  /** Áp/gửi một action. Offline: action sai luật ném GameRuleError (state giữ nguyên). */
  dispatch: (action: GameAction) => void
  dispatchMany: (actions: GameAction[]) => void
  loadRemote: (state: GameState, seats: SeatInfo[], you: PlayerId | null, matchId: string, send: (a: IntentAction[]) => void) => void
  applyRemote: (state: GameState, events: GameEvent[]) => void
  updateSeats: (seats: SeatInfo[]) => void
  reset: () => void
}

const BOT_NAMES = ['Minh', 'Lan', 'Tuấn']

function seatsFromInfo(seats: SeatInfo[]): Record<PlayerId, SeatMeta> {
  const out: Record<PlayerId, SeatMeta> = {}
  for (const s of seats) {
    if (!s.playerId) continue
    out[s.playerId] = { name: s.name, skin: s.skin, kind: s.kind, connected: s.connected, botLevel: 'normal' }
  }
  return out
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  mode: 'offline',
  humanId: null,
  seats: {},
  matchId: '',
  actionCount: 0,
  awaitingServer: false,
  offlineConfig: null,
  sendIntent: null,

  startOffline: (config, seed = Date.now()) => {
    const botCount = Math.max(1, Math.min(3, config.bots))
    const players = [{ name: config.name, isBot: false }, ...BOT_NAMES.slice(0, botCount).map((name) => ({ name, isBot: true }))]
    const game = createGame(players, seed)
    // Bot dùng các skin mặc định chưa trùng với skin của người chơi.
    const botSkins = SEAT_SKINS.filter((s) => s !== config.skin)
    const seats: Record<PlayerId, SeatMeta> = {}
    game.players.forEach((p, i) => {
      seats[p.id] = {
        name: p.name,
        skin: i === 0 ? config.skin : botSkins[(i - 1) % botSkins.length],
        kind: p.isBot ? 'bot' : 'human',
        connected: true,
        botLevel: config.level,
      }
    })
    useAnimationStore.getState().reset(game)
    set({
      game,
      mode: 'offline',
      humanId: game.players[0].id,
      seats,
      matchId: `offline-${String(seed)}`,
      actionCount: 0,
      awaitingServer: false,
      offlineConfig: config,
      sendIntent: null,
    })
  },

  dispatch: (action) => get().dispatchMany([action]),

  dispatchMany: (actions) => {
    const { game, mode, sendIntent } = get()
    if (!game || actions.length === 0) return
    if (mode === 'online') {
      if (!sendIntent) return
      // Gộp cả lần bấm vào MỘT yêu cầu: gửi rời từng cái thì có thể tới server sai thứ tự (Kết thúc lượt trước Mua).
      sendIntent(
        actions.map((action) => {
          const { playerId: _ignored, ...intent } = action
          void _ignored
          return intent as IntentAction
        }),
      )
      set({ awaitingServer: true })
      return
    }
    for (const action of actions) {
      const { state, events } = applyAction(get().game ?? game, action)
      set({ game: state, actionCount: get().actionCount + 1 })
      useAnimationStore.getState().enqueue(events)
    }
  },

  loadRemote: (state, seats, you, matchId, send) => {
    useAnimationStore.getState().reset(state)
    set({
      game: state,
      mode: 'online',
      humanId: you,
      seats: seatsFromInfo(seats),
      matchId,
      actionCount: get().actionCount + 1,
      awaitingServer: false,
      offlineConfig: null,
      sendIntent: send,
    })
  },

  applyRemote: (state, events) => {
    set({ game: state, actionCount: get().actionCount + 1, awaitingServer: false })
    useAnimationStore.getState().enqueue(events)
  },

  updateSeats: (seats) => {
    const next = seatsFromInfo(seats)
    if (Object.keys(next).length > 0) set({ seats: next })
  },

  reset: () => set({ game: null, humanId: null, seats: {}, matchId: '', actionCount: 0, awaitingServer: false, sendIntent: null }),
}))

/** Skin của người chơi `id` (ghế chưa có skin thì lấy skin mặc định theo thứ tự ghế). */
export function useSeatSkin(id: PlayerId | null | undefined, seat = 0): SkinDef {
  const skin = useGameStore((s) => (id ? s.seats[id]?.skin : undefined))
  return skinById(skin ?? SEAT_SKINS[seat % SEAT_SKINS.length])
}
