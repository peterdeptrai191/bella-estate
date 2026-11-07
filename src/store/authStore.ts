/**
 * Tài khoản trên máy này: khóa phiên lưu localStorage, thông tin tài khoản + phòng đang chơi lấy từ server.
 * Đăng nhập rồi thì vào phòng ở máy nào cũng nhận lại đúng ghế (server gắn ghế với tài khoản).
 */
import { create } from 'zustand'
import { API_PATH, type AccountInfo, type AuthResponse, type MeResponse } from '../net/protocol'
import { useProfileStore } from './profileStore'

const KEY = 'bella-estate:auth'

function readToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(KEY, token)
    else localStorage.removeItem(KEY)
  } catch {
    // Không lưu được: chỉ đăng nhập trong lần mở này.
  }
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  let response: Response
  try {
    response = await fetch(API_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Có lỗi máy chủ.')
  return data as T
}

interface AuthStore {
  token: string | null
  account: AccountInfo | null
  /** Mã phòng đang chơi dở của tài khoản (để vào lại). */
  activeRoom: string | null
  busy: boolean
  error: string | null
  /** Bảng đăng nhập / tạo tài khoản đang mở. */
  open: boolean
  setOpen: (open: boolean) => void
  /** Kiểm tra phiên đã lưu (gọi khi mở game và khi quay lại menu). */
  refresh: () => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  rename: (name: string) => Promise<void>
}

function signedIn(set: (patch: Partial<AuthStore>) => void, result: AuthResponse) {
  saveToken(result.token)
  set({ token: result.token, account: result.account, busy: false, error: null, open: false })
  // Tên trong game = tên tài khoản (không hỏi tên lần đầu nữa).
  useProfileStore.getState().setName(result.account.name)
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: readToken(),
  account: null,
  activeRoom: null,
  busy: false,
  error: null,
  open: false,
  setOpen: (open) => set({ open, error: null }),

  refresh: async () => {
    const token = get().token
    if (!token) return
    try {
      const me = await post<MeResponse>({ op: 'me', auth: token })
      if (!me.account) {
        saveToken(null)
        set({ token: null, account: null, activeRoom: null })
        return
      }
      set({ account: me.account, activeRoom: me.activeRoom })
      useProfileStore.getState().setName(me.account.name)
    } catch {
      // Mất mạng: giữ phiên, thử lại lần sau.
    }
  },

  login: async (username, password) => {
    set({ busy: true, error: null })
    try {
      signedIn(set, await post<AuthResponse>({ op: 'login', username, password }))
      void get().refresh()
      return true
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : String(error) })
      return false
    }
  },

  register: async (username, password, name) => {
    set({ busy: true, error: null })
    try {
      signedIn(set, await post<AuthResponse>({ op: 'register', username, password, name }))
      return true
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : String(error) })
      return false
    }
  },

  logout: async () => {
    const token = get().token
    saveToken(null)
    set({ token: null, account: null, activeRoom: null })
    if (token) await post({ op: 'logout', auth: token }).catch(() => undefined)
  },

  rename: async (name) => {
    const token = get().token
    if (!token || !get().account) return
    try {
      const { account } = await post<{ account: AccountInfo }>({ op: 'rename', auth: token, name })
      set({ account })
    } catch {
      // Đổi tên trên server lỗi: tên trên máy vẫn đổi, lần sau đồng bộ lại.
    }
  },
}))

/** Khóa phiên hiện tại (net.ts gửi kèm khi vào phòng). */
export const authToken = () => useAuthStore.getState().token
