import { create } from 'zustand'
import { DEFAULT_SKIN, META, SKINS, skinById } from '../config/skins'

/**
 * Hồ sơ người chơi trên máy này: tên, skin đang dùng, Vàng, skin đã mua (GDD mục 9).
 * Chưa có tài khoản nên lưu trong trình duyệt (localStorage); đọc/ghi lỗi thì chạy với giá trị mặc định.
 */
interface Profile {
  name: string
  skin: string
  gold: number
  owned: string[]
  /** Ván đã nhận thưởng (chống nhận hai lần). */
  rewarded: string[]
}

interface ProfileStore extends Profile {
  setName: (name: string) => void
  equip: (skinId: string) => void
  /** Mua skin bằng Vàng. Trả về false nếu không đủ Vàng. */
  buy: (skinId: string) => boolean
  /** Cộng Vàng sau trận (mỗi ván một lần). Trả về số Vàng nhận được, 0 nếu đã nhận rồi. */
  reward: (matchId: string, won: boolean) => number
}

const KEY = 'bella-estate:profile'
const freeSkins = SKINS.filter((s) => s.price === 0).map((s) => s.id)

function load(): Profile {
  const fallback: Profile = { name: META.defaultName, skin: DEFAULT_SKIN, gold: META.startingGold, owned: freeSkins, rewarded: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return fallback
    const p = data as Partial<Profile>
    return {
      name: typeof p.name === 'string' && p.name.trim() ? p.name.slice(0, META.maxNameLength) : fallback.name,
      skin: skinById(p.skin).id,
      gold: typeof p.gold === 'number' && p.gold >= 0 ? Math.floor(p.gold) : fallback.gold,
      owned: Array.from(new Set([...freeSkins, ...(Array.isArray(p.owned) ? p.owned.filter((x) => typeof x === 'string') : [])])),
      rewarded: Array.isArray(p.rewarded) ? p.rewarded.filter((x) => typeof x === 'string').slice(-20) : [],
    }
  } catch {
    return fallback
  }
}

function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Không lưu được (trình duyệt chặn): vẫn chơi được, chỉ mất tiến trình khi tải lại trang.
  }
}

const pick = (s: ProfileStore): Profile => ({ name: s.name, skin: s.skin, gold: s.gold, owned: s.owned, rewarded: s.rewarded })

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...load(),
  setName: (name) => {
    set({ name: name.slice(0, META.maxNameLength) })
    save(pick(get()))
  },
  equip: (skinId) => {
    if (!get().owned.includes(skinId)) return
    set({ skin: skinId })
    save(pick(get()))
  },
  buy: (skinId) => {
    const skin = skinById(skinId)
    const s = get()
    if (s.owned.includes(skin.id)) return true
    if (s.gold < skin.price) return false
    set({ gold: s.gold - skin.price, owned: [...s.owned, skin.id], skin: skin.id })
    save(pick(get()))
    return true
  },
  reward: (matchId, won) => {
    const s = get()
    if (!matchId || s.rewarded.includes(matchId)) return 0
    const amount = won ? META.goldWin : META.goldLose
    set({ gold: s.gold + amount, rewarded: [...s.rewarded, matchId].slice(-20) })
    save(pick(get()))
    return amount
  },
}))

/** Tên hiển thị hợp lệ (không rỗng). */
export function displayName(name: string): string {
  return name.trim().slice(0, META.maxNameLength) || META.defaultName
}
