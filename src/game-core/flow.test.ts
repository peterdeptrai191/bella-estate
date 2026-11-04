import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../config/economy'
import { applyAction, createGame, currentPlayer, getTimeoutAction, type GameState } from './index'
import { autoAction, humanPrompt } from './flow'

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

const isP1 = (id: string) => id === 'p1'

describe('Nhịp lượt người + bot', () => {
  it('đầu ván: người chơi được hỏi tung xúc xắc, không có gì tự làm', () => {
    const s = game()
    expect(humanPrompt(s, 'p1')).toMatchObject({ kind: 'ROLL', flyTiles: [], onIsland: false })
    expect(autoAction(s, isP1)).toBeNull()
  })

  it('sau khi tung: tự đi quân', () => {
    let s = game()
    s = applyAction(s, { type: 'ROLL_DICE', playerId: 'p1' }).state
    expect(autoAction(s, isP1)).toEqual({ type: 'MOVE', playerId: 'p1' })
  })

  it('đứng ở thành phố trống đủ tiền: hỏi mua đất', () => {
    const s = standingOn(game(), 6)
    expect(humanPrompt(s, 'p1')).toEqual({ kind: 'BUY', tileIndex: 6 })
    expect(autoAction(s, isP1)).toBeNull()
  })

  it('không còn gì để làm: tự kết thúc lượt', () => {
    const s = standingOn(game(), 3 /* Cơ Hội nhưng không có pending */)
    expect(humanPrompt(s, 'p1')).toBeNull()
    expect(autoAction(s, isP1)).toEqual({ type: 'END_TURN', playerId: 'p1' })
  })

  it('lượt của bot: autoAction là quyết định của bot', () => {
    let s = game()
    s = { ...s, currentPlayerIndex: 1 }
    expect(humanPrompt(s, 'p1')).toBeNull()
    expect(autoAction(s, isP1)).toEqual({ type: 'ROLL_DICE', playerId: 'p2' })
  })

  it('người dùng hành động mặc định khi hết giờ, bot tự chơi: ván luôn kết thúc', () => {
    for (const seed of [3, 8]) {
      let s = game(seed)
      for (let i = 0; i < 20_000 && s.phase === 'playing'; i++) {
        const action =
          autoAction(s, isP1) ?? (currentPlayer(s).id === 'p1' ? getTimeoutAction(s) : null)
        expect(action).not.toBeNull()
        if (!action) break
        s = applyAction(s, action).state
      }
      expect(s.phase).toBe('finished')
    }
  })

  it('khởi đầu với đúng số tiền trong economy', () => {
    expect(game().players[0].money).toBe(ECONOMY.startingMoney)
  })
})

describe('autoAction theo mức bot', () => {
  it('ghế bot dùng đúng mức được giao', () => {
    const s = { ...game(), currentPlayerIndex: 1 }
    expect(autoAction(s, isP1, () => 'easy')).toEqual({ type: 'ROLL_DICE', playerId: 'p2' })
    expect(autoAction(s, isP1, () => 'hard')).toEqual({ type: 'ROLL_DICE', playerId: 'p2' })
  })
})
