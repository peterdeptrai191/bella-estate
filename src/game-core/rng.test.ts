import { describe, expect, it } from 'vitest'
import { nextRandom, seedToRngState, toDie } from './rng'

describe('RNG có seed', () => {
  it('cùng seed cho cùng dãy số', () => {
    const seq = (seed: number) => {
      let s = seed
      return Array.from({ length: 5 }, () => {
        const [v, next] = nextRandom(s)
        s = next
        return v
      })
    }
    expect(seq(42)).toEqual(seq(42))
    expect(seq(42)).not.toEqual(seq(43))
  })

  it('giá trị trong [0, 1) và xúc xắc phủ đủ 1..6', () => {
    let s = 7
    const faces = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const [v, next] = nextRandom(s)
      s = next
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      faces.add(toDie(v))
    }
    expect([...faces].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('seed chuỗi ổn định', () => {
    expect(seedToRngState('bella')).toBe(seedToRngState('bella'))
    expect(seedToRngState('bella')).not.toBe(seedToRngState('monopoly'))
  })
})
