import { create } from 'zustand'
import type { CardId, PlayerId } from '../game-core'

/** Chế độ chọn ô trực tiếp trên bàn cờ 3D (Lễ Hội, Sân Bay, Động Đất, nhà miễn phí, bán tài sản). */
export interface BoardPick {
  tiles: number[]
  onPick: (tileIndex: number) => void
  /** Nhãn hiện trên các ô chọn được (vd. giá bán). */
  labels?: Record<number, string>
  /** Ô đang được chọn (chờ bấm xác nhận). */
  selected?: number | null
  tone?: 'good' | 'bad'
}

export interface Banner {
  id: number
  text: string
  tone: 'double' | 'info' | 'bad' | 'good'
}

export interface CardReveal {
  card: CardId
  playerId: PlayerId
  /** Người chơi trên máy này rút: chờ bấm OK. */
  interactive: boolean
}

export interface TurnDeadline {
  playerId: PlayerId
  startedAt: number
  endsAt: number
}

export type Screen = 'home' | 'bots' | 'friends' | 'lobby' | 'shop' | 'maps' | 'game'

/** Trạng thái thuần giao diện — không chứa luật chơi. */
interface UiStore {
  screen: Screen
  setScreen: (screen: Screen) => void
  /** Ô đang xem thông tin (bấm vào ô). */
  selectedTile: number | null
  pick: BoardPick | null
  banners: Banner[]
  card: CardReveal | null
  deadline: TurnDeadline | null
  /** Dev: để bot chơi thay người (kiểm tra cả ván). */
  autoplayHuman: boolean
  /** Hệ số nhân thời gian lượt (dev: kéo dài khi gỡ lỗi / chụp màn hình). */
  turnTimeScale: number
  /** Người chơi đang zoom/kéo bàn cờ khỏi toàn cảnh (hiện nút "Toàn cảnh"). */
  viewZoomed: boolean
  /** Kết quả xúc xắc vừa tung (hiện số nổi trên xúc xắc), xoá khi sang lượt mới. */
  diceShown: { dice: [number, number]; total: number } | null
  /** Ô quân cờ sẽ dừng sau khi tung (viền vàng), xoá khi sang lượt mới. */
  targetTile: number | null
  /** Toạ độ màn hình (px, trong khung canvas) của tâm bàn cờ — chỗ đặt nút Tung xúc xắc. */
  boardCenter: { x: number; y: number } | null
  /** Bảng luật chơi đang mở. */
  helpOpen: boolean
  selectTile: (tileIndex: number | null) => void
  setPick: (pick: BoardPick | null) => void
  /** Bấm một ô trên bàn cờ: đang ở chế độ chọn thì chọn, không thì xem thông tin ô. */
  clickTile: (tileIndex: number) => void
  showBanner: (text: string, tone: Banner['tone'], seconds: number) => void
  showCard: (reveal: CardReveal, autoCloseSeconds: number) => Promise<void>
  closeCard: () => void
  setDeadline: (deadline: TurnDeadline | null) => void
  setAutoplayHuman: (on: boolean) => void
}

let bannerId = 1
let closeCurrentCard: (() => void) | null = null

export const useUiStore = create<UiStore>((set, get) => ({
  screen: 'home',
  setScreen: (screen) => set({ screen, selectedTile: null }),
  selectedTile: null,
  pick: null,
  banners: [],
  card: null,
  deadline: null,
  autoplayHuman: false,
  turnTimeScale: 1,
  viewZoomed: false,
  diceShown: null,
  targetTile: null,
  boardCenter: null,
  helpOpen: false,
  selectTile: (selectedTile) => set({ selectedTile }),
  setPick: (pick) => set({ pick }),
  clickTile: (tileIndex) => {
    const { pick } = get()
    if (pick) {
      if (pick.tiles.includes(tileIndex)) pick.onPick(tileIndex)
      return
    }
    set({ selectedTile: get().selectedTile === tileIndex ? null : tileIndex })
  },
  showBanner: (text, tone, seconds) => {
    const banner = { id: bannerId++, text, tone }
    set((s) => ({ banners: [...s.banners, banner] }))
    setTimeout(() => set((s) => ({ banners: s.banners.filter((b) => b.id !== banner.id) })), seconds * 1000)
  },
  showCard: (reveal, autoCloseSeconds) =>
    new Promise<void>((resolve) => {
      closeCurrentCard?.()
      let timer: ReturnType<typeof setTimeout> | undefined
      const close = () => {
        if (closeCurrentCard !== close) return
        closeCurrentCard = null
        clearTimeout(timer)
        set({ card: null })
        resolve()
      }
      closeCurrentCard = close
      timer = setTimeout(close, autoCloseSeconds * 1000)
      set({ card: reveal })
    }),
  closeCard: () => closeCurrentCard?.(),
  setDeadline: (deadline) => set({ deadline }),
  setAutoplayHuman: (autoplayHuman) => set({ autoplayHuman }),
}))
