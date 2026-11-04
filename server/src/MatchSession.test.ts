import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../../src/config/economy'
import { humanPrompt } from '../../src/game-core'
import { NET, type ServerMessages } from '../../src/net/protocol'
import { MatchSession, randomCode, type Clock } from './MatchSession'

/** Đồng hồ giả: chạy hẹn giờ theo thứ tự khi tua. */
function fakeClock() {
  let now = 1_000_000
  let id = 0
  const timers = new Map<number, { at: number; fn: () => void }>()
  const clock: Clock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      timers.set(++id, { at: now + ms, fn })
      return id
    },
    clearTimeout: (h) => {
      timers.delete(h as number)
    },
  }
  const advance = (ms: number) => {
    const end = now + ms
    for (;;) {
      let next: [number, { at: number; fn: () => void }] | null = null
      for (const entry of timers) if (entry[1].at <= end && (!next || entry[1].at < next[1].at)) next = entry
      if (!next) break
      timers.delete(next[0])
      now = next[1].at
      next[1].fn()
    }
    now = end
  }
  return { clock, advance }
}

type Sent = { to: string; type: keyof ServerMessages; message: ServerMessages[keyof ServerMessages] }

function setup(mode: 'private' | 'quick', capacity = 4) {
  const { clock, advance } = fakeClock()
  const sent: Sent[] = []
  let seq = 1
  const match = new MatchSession({
    mode,
    code: 'ABC234',
    capacity,
    clock,
    seed: 7,
    random: () => (seq = (seq * 48271) % 2147483647),
    send: (to, type, message) => sent.push({ to, type, message }),
  })
  const last = <K extends keyof ServerMessages>(to: string, type: K) =>
    [...sent].reverse().find((m) => m.to === to && m.type === type)?.message as ServerMessages[K] | undefined
  return { match, sent, advance, last }
}

describe('Phòng riêng', () => {
  it('mã phòng 6 ký tự trong bảng chữ cho phép', () => {
    const code = randomCode()
    expect(code).toHaveLength(NET.codeLength)
    expect([...code].every((c) => NET.codeAlphabet.includes(c))).toBe(true)
  })

  it('đủ người thì tự bắt đầu; mỗi người nhận state và ghế của mình', () => {
    const { match, last } = setup('private', 2)
    match.join('a', { name: 'An', skin: 'male-a' })
    expect(last('a', 'lobby')?.seats).toHaveLength(1)
    match.join('b', { name: 'Bình', skin: 'cat' })
    expect(match.started).toBe(true)
    expect(last('a', 'sync')?.you).toBe('p1')
    expect(last('b', 'sync')?.you).toBe('p2')
    expect(last('b', 'sync')?.seats.map((s) => s.skin)).toEqual(['male-a', 'cat'])
  })

  it('trùng tên, trùng skin thì server tự phân biệt', () => {
    const { match } = setup('private', 3)
    match.join('a', { name: 'Bạn', skin: 'female-b' })
    match.join('b', { name: 'Bạn', skin: 'female-b' })
    expect(match.seats.map((s) => s.name)).toEqual(['Bạn', 'Bạn 2'])
    expect(match.seats[0].skin).not.toBe(match.seats[1].skin)
  })

  it('state gửi cho client không kèm trạng thái RNG', () => {
    const { match, last } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    expect(last('a', 'sync')?.state.rngState).toBe(0)
  })

  it('chỉ chủ phòng bắt đầu sớm, và cần ít nhất 2 người', () => {
    const { match } = setup('private', 4)
    match.join('a', { name: 'An', skin: '' })
    expect(() => match.requestStart('a')).toThrow()
    match.join('b', { name: 'Bình', skin: '' })
    expect(() => match.requestStart('b')).toThrow()
    match.requestStart('a')
    expect(match.game?.players).toHaveLength(2)
  })

  it('không nhận ý định của người chưa tới lượt; playerId do server gán', () => {
    const { match, last } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    expect(() => match.intent('b', { type: 'ROLL_DICE' })).toThrow('Chưa tới lượt')
    match.intent('a', { type: 'ROLL_DICE' })
    const events = last('b', 'events')?.events ?? []
    expect(events[0]).toMatchObject({ type: 'DICE_ROLLED', playerId: 'p1' })
  })
})

describe('Ghép trận nhanh', () => {
  it('chờ 30 giây rồi thêm bot cho đủ 4 ghế', () => {
    const { match, advance, last } = setup('quick')
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    expect(match.started).toBe(false)
    expect(last('a', 'lobby')?.quickRemainingMs).toBe(NET.quickWaitSec * 1000)
    advance(NET.quickWaitSec * 1000 - 1)
    expect(match.started).toBe(false)
    advance(1)
    expect(match.started).toBe(true)
    expect(match.seats.map((s) => s.kind)).toEqual(['human', 'human', 'bot', 'bot'])
  })

  it('đủ 4 người thì bắt đầu ngay', () => {
    const { match } = setup('quick')
    for (const id of ['a', 'b', 'c', 'd']) match.join(id, { name: id, skin: '' })
    expect(match.started).toBe(true)
  })
})

describe('Nhịp ván trên server', () => {
  it('hết giờ lượt thì server tự hành động (tự tung xúc xắc)', () => {
    const { match, advance, last } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    const deadline = last('a', 'deadline')
    expect(deadline?.playerId).toBe('p1')
    expect(match.game?.turn.dice).toBeNull()
    advance(ECONOMY.turnTimeLimitSec * 1000 + 2000)
    expect(match.game?.turn.dice).not.toBeNull()
  })

  it('mất kết nối: bot chơi thay; kết nối lại thì nhận lại toàn bộ state', () => {
    const { match, advance, last, sent } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    match.leave('a', false)
    // Không cần chờ 20 giây: bot chơi ngay lượt của An.
    advance(5000)
    expect(match.game?.turn.dice).not.toBeNull()
    const before = sent.filter((m) => m.to === 'a' && m.type === 'sync').length
    match.reconnect('a')
    expect(sent.filter((m) => m.to === 'a' && m.type === 'sync').length).toBe(before + 1)
    expect(last('a', 'sync')?.state).toEqual({ ...match.game, rngState: 0 })
  })

  it('hết thời gian giữ chỗ thì ghế giao hẳn cho bot', () => {
    const { match } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    match.leave('a', false)
    match.abandon('a')
    expect(match.seats[0].kind).toBe('bot')
  })

  it('cả bàn bỏ mặc (không ai bấm): server vẫn chơi tới hết ván', () => {
    const { match, advance } = setup('quick')
    match.join('a', { name: 'An', skin: '' })
    advance(NET.quickWaitSec * 1000)
    for (let i = 0; i < 4000 && match.game?.phase === 'playing'; i++) advance(30_000)
    expect(match.game?.phase).toBe('finished')
  })

  it('người chơi chỉ được hỏi khi thật sự phải quyết định (bước hiển nhiên server tự làm)', () => {
    const { match, advance } = setup('private', 2)
    match.join('a', { name: 'An', skin: '' })
    match.join('b', { name: 'Bình', skin: '' })
    match.intent('a', { type: 'ROLL_DICE' })
    advance(60_000)
    // Sau khi tung, quân tự đi; nếu tới ô cần quyết định thì dừng chờ, không thì sang lượt người kia.
    const game = match.game
    if (!game) throw new Error('chưa có ván')
    expect(game.turn.step === 'MOVE').toBe(false)
    expect(humanPrompt(game, game.players[game.currentPlayerIndex].id)).not.toBeNull()
  })
})
