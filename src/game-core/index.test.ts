import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../config/economy'
import { createGame } from './index'

describe('createGame', () => {
  it('khởi tạo người chơi với tiền và vị trí ban đầu', () => {
    const state = createGame([{ name: 'An' }, { name: 'Bot', isBot: true }])
    expect(state.players).toHaveLength(2)
    expect(state.players.every((p) => p.money === ECONOMY.startingMoney)).toBe(true)
    expect(state.players.every((p) => p.position === 0)).toBe(true)
    expect(state.players[1].isBot).toBe(true)
    expect(state.round).toBe(1)
  })

  it('từ chối số người chơi ngoài khoảng 2–4', () => {
    expect(() => createGame([{ name: 'Solo' }])).toThrow()
    expect(() => createGame(Array.from({ length: 5 }, (_, i) => ({ name: `P${i}` })))).toThrow()
  })
})
