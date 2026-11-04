import { create } from 'zustand'
import type { LobbyInfo } from '../net/protocol'

/** Trạng thái kết nối online và sảnh chờ (do store/net.ts cập nhật). */
interface OnlineStore {
  status: 'idle' | 'connecting' | 'lobby' | 'playing' | 'reconnecting' | 'error'
  error: string | null
  lobby: LobbyInfo | null
  /** Thời điểm nhận tin sảnh chờ gần nhất (để đếm ngược ghép nhanh). */
  lobbyAt: number
  pendingLabel: string
  set: (patch: Partial<Omit<OnlineStore, 'set'>>) => void
}

export const useOnlineStore = create<OnlineStore>((set) => ({
  status: 'idle',
  error: null,
  lobby: null,
  lobbyAt: 0,
  pendingLabel: '',
  set: (patch) => set(patch),
}))
