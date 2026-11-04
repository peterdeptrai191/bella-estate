import { describe, expect, it } from 'vitest'
import { buildCost, createGame, landPrice, type GameState } from '../game-core'
import { levelOptions } from './match'

function game(seed = 1): GameState {
  return createGame(
    [{ name: 'Bạn' }, { name: 'Bot 1', isBot: true }, { name: 'Bot 2', isBot: true }, { name: 'Bot 3', isBot: true }],
    seed,
  )
}

/** Đặt người chơi 1 đứng ở ô `tile`, đang ở bước ACT (không qua reducer — chỉ dùng cho kiểm tra prompt). */
function standingOn(state: GameState, tile: number): GameState {
  const s = structuredClone(state)
  s.players[0].position = tile
  s.turn = { ...s.turn, step: 'ACT', dice: [1, 2] }
  return s
}

describe('Xem trước lựa chọn mua/xây', () => {
  it('levelOptions khi mua: đất + tối đa 3 nhà (Landmark chưa được xây ở lần mua), giá cộng dồn', () => {
    const s = standingOn(game(), 6)
    const options = levelOptions(s, 6, true)
    expect(options.map((o) => o.level)).toEqual([0, 1, 2, 3])
    const land = landPrice(6)
    expect(options[0].cost).toBe(land)
    expect(options[2].cost).toBe(land + buildCost(6, 1) + buildCost(6, 2))
    expect(options[3].actions.map((a) => a.type)).toEqual(['BUY', 'BUILD', 'BUILD', 'BUILD'])
  })

  it('levelOptions bị giới hạn bởi tiền mặt', () => {
    const s = standingOn(game(), 6)
    s.players[0].money = landPrice(6) + buildCost(6, 1)
    expect(levelOptions(s, 6, true).map((o) => o.level)).toEqual([0, 1])
  })

})
