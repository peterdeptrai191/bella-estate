/**
 * RNG có seed (mulberry32), dạng hàm thuần: nhận trạng thái, trả về [số ngẫu nhiên, trạng thái mới].
 * Trạng thái lưu trong GameState nên cùng seed + cùng chuỗi action luôn ra cùng kết quả (test, replay,
 * server kiểm tra lại được).
 */
export function nextRandom(rngState: number): [value: number, nextState: number] {
  const next = (rngState + 0x6d2b79f5) | 0
  let r = Math.imul(next ^ (next >>> 15), 1 | next)
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296
  return [value, next]
}

/** Chuyển seed (số hoặc chuỗi) thành trạng thái RNG ban đầu. */
export function seedToRngState(seed: number | string): number {
  if (typeof seed === 'number') return seed | 0
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  }
  return h | 0
}

/** Giá trị xúc xắc 1..6 từ một số ngẫu nhiên [0, 1). */
export function toDie(value: number): number {
  return Math.floor(value * 6) + 1
}
