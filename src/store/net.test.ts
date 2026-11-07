import { describe, expect, it } from 'vitest'
import { applyAction, createGame, type GameEvent, type GameState } from '../game-core'
import { createRandomPlayer, nextRandomAction } from '../game-core/randomPlayer'
import { applyEventToView, viewFromGame, viewMatchesGame } from './boardView'
import { planAccept } from './net'

describe('Áp câu trả lời của server (chống phát trùng event)', () => {
  it('các trường hợp cơ bản', () => {
    expect(planAccept({ full: true, seq: 5, from: -1 }, -1, false)).toBe('load')
    expect(planAccept({ full: false, seq: 6, from: 5 }, 5, true)).toBe('apply')
    expect(planAccept({ full: false, seq: 6, from: 4 }, 6, true)).toBe('skip')
    expect(planAccept({ full: false, seq: 5, from: 4 }, 6, true)).toBe('skip')
    expect(planAccept({ full: false, seq: 8, from: 4 }, 6, true)).toBe('refetch')
    expect(planAccept({ full: true, seq: 4, from: -1 }, 6, true)).toBe('skip')
  })

  it('câu trả lời về lộn xộn, trùng lặp: view vẫn khớp state, tiền không bao giờ âm', () => {
    // Server giả: lưu các lô event, trả câu trả lời tính từ một mốc bất kỳ.
    let state: GameState = createGame([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 9)
    const log: Array<{ seq: number; events: GameEvent[]; state: GameState }> = []
    const policy = createRandomPlayer(9)
    for (let seq = 1; seq <= 400 && state.phase === 'playing'; seq++) {
      const action = nextRandomAction(state, policy)
      if (!action) break
      const result = applyAction(state, action)
      state = result.state
      log.push({ seq, events: result.events, state })
    }
    const respond = (from: number) => {
      const last = log.at(-1)
      if (!last) throw new Error('trống')
      return { full: false, seq: last.seq, from, events: log.filter((b) => b.seq > from).flatMap((b) => b.events), state: last.state }
    }
    // Client: bắt đầu từ mốc 0 với state ban đầu, nhận câu trả lời tính từ các mốc ngẫu nhiên (cũ, trùng, đúng).
    let rnd = 7
    const rand = (n: number) => {
      rnd = (rnd * 48271) % 2147483647
      return rnd % n
    }
    let since = 0
    let view = viewFromGame(createGame([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 9))
    let clientState: GameState | null = null
    const upto = (seq: number) => {
      const partial = log.filter((b) => b.seq <= seq)
      const last = partial.at(-1)
      if (!last) return null
      return { full: false, seq: last.seq, from: 0, events: [], state: last.state }
    }
    for (let step = 0; step < 2000; step++) {
      const serverSeq = Math.min(log.length, 1 + Math.floor(step / 5))
      const snap = upto(serverSeq)
      if (!snap) continue
      const from = Math.max(0, since - rand(3))
      const response = { ...respond(from), seq: snap.seq, state: snap.state, events: log.filter((b) => b.seq > from && b.seq <= snap.seq).flatMap((b) => b.events) }
      const plan = planAccept(response, since, true)
      if (plan === 'apply') {
        for (const e of response.events) view = applyEventToView(view, e)
        since = response.seq
        clientState = response.state
        expect(viewMatchesGame(view, clientState)).toBe(true)
        expect(view.players.every((p) => p.money >= 0)).toBe(true)
      }
    }
    expect(since).toBe(log.length)
  })
})
