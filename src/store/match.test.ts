import { describe, expect, it } from 'vitest'
import { applyAction, buildCost, createGame, landPrice, type GameState } from '../game-core'
import { autoSellPlan, levelOptions } from './match'

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
  it('levelOptions vòng đầu (chưa qua Xuất Phát): đất + tối đa 2 nhà', () => {
    expect(levelOptions(standingOn(game(), 6), 6, true).map((o) => o.level)).toEqual([0, 1, 2])
  })

  it('levelOptions khi mua từ vòng 2: đất + tối đa 3 nhà (Landmark chưa được xây ở lần mua), giá cộng dồn', () => {
    const s = standingOn(game(), 6)
    s.players[0].passedStart = true
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


  it('bán tự động: dãy lệnh bán dừng đúng lúc hết nợ (không bán thừa, không lệnh trùng)', () => {
    let s = game()
    const tiles = s.tiles.map((_, i) => i).filter((i) => i === 1 || i === 2 || i === 4)
    s = structuredClone(s)
    for (const i of tiles) s.tiles[i] = { owner: s.players[0].id, level: 1 }
    s.players[0].money = 0
    s.turn = { ...s.turn, step: 'ACT', pending: { type: 'DEBT', reason: 'TAX', payments: [{ to: null, amount: 60 }], tileIndex: null, discounted: false } }
    const plan = autoSellPlan(s)
    expect(plan.length).toBeGreaterThan(0)
    expect(new Set(plan.map((a) => (a.type === 'SELL' ? a.tileIndex : -1))).size).toBe(plan.length)
    let after = s
    for (const a of plan) after = applyAction(after, a).state
    expect(after.turn.pending).toBeNull()
    expect(after.players[0].money).toBeGreaterThanOrEqual(0)
  })
})
