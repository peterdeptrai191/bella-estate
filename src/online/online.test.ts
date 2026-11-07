import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../config/economy'
import { getTimeoutAction, humanPrompt } from '../game-core'
import { NET, type AuthResponse, type JoinResponse, type MeResponse, type RoomView } from '../net/protocol'
import { createApi } from './handler'
import { createRoom, joinRoom, randomCode, requestStart, tick, viewFor, type Rng } from './room'
import { memoryStore, redisCredentials } from './store'

/** RNG tất định cho test. */
function testRng(seed = 1): Rng {
  let s = seed
  return {
    int: (max) => {
      s = (s * 48271) % 2147483647
      return s % max
    },
  }
}

const TOKENS = ['a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32), 'd'.repeat(32)]

describe('Logic phòng (thuần)', () => {
  it('mã phòng 6 ký tự trong bảng chữ cho phép', () => {
    const code = randomCode(testRng())
    expect(code).toHaveLength(NET.codeLength)
    expect([...code].every((c) => NET.codeAlphabet.includes(c))).toBe(true)
  })

  it('đủ người thì tự bắt đầu; mỗi người thấy ghế của mình; state không kèm RNG', () => {
    const rng = testRng()
    const room = createRoom('ABC234', 'private', 2, 0)
    joinRoom(room, { name: 'An', skin: 'male-a' }, TOKENS[0], 0, rng)
    expect(room.game).toBeNull()
    joinRoom(room, { name: 'Bình', skin: 'cat' }, TOKENS[1], 0, rng)
    expect(room.game).not.toBeNull()
    expect(viewFor(room, TOKENS[0], -1, 0).game?.you).toBe('p1')
    expect(viewFor(room, TOKENS[1], -1, 0).game?.you).toBe('p2')
    expect(viewFor(room, TOKENS[1], -1, 0).game?.state.rngState).toBe(0)
  })

  it('trùng tên, trùng skin thì tự phân biệt', () => {
    const rng = testRng()
    const room = createRoom('ABC234', 'private', 3, 0)
    joinRoom(room, { name: 'Bạn', skin: 'female-b' }, TOKENS[0], 0, rng)
    joinRoom(room, { name: 'Bạn', skin: 'female-b' }, TOKENS[1], 0, rng)
    expect(room.seats.map((s) => s.name)).toEqual(['Bạn', 'Bạn 2'])
    expect(room.seats[0].skin).not.toBe(room.seats[1].skin)
  })

  it('chỉ chủ phòng bắt đầu sớm, và cần ít nhất 2 người', () => {
    const rng = testRng()
    const room = createRoom('ABC234', 'private', 4, 0)
    joinRoom(room, { name: 'An', skin: '' }, TOKENS[0], 0, rng)
    expect(() => requestStart(room, TOKENS[0], 0, rng)).toThrow()
    joinRoom(room, { name: 'Bình', skin: '' }, TOKENS[1], 0, rng)
    expect(() => requestStart(room, TOKENS[1], 0, rng)).toThrow()
    requestStart(room, TOKENS[0], 0, rng)
    expect(room.game?.players).toHaveLength(2)
  })

  it('ghép nhanh: quá 30 giây thì thêm bot cho đủ 4 ghế', () => {
    const rng = testRng()
    const room = createRoom('ABC234', 'quick', 4, 0)
    joinRoom(room, { name: 'An', skin: '' }, TOKENS[0], 0, rng)
    expect(tick(room, NET.quickWaitSec * 1000 - 1, rng)).toBe(false)
    expect(tick(room, NET.quickWaitSec * 1000, rng)).toBe(true)
    expect(room.seats.map((s) => s.kind)).toEqual(['human', 'bot', 'bot', 'bot'])
  })

  it('bỏ mặc cả ván (chỉ còn người hỏi server): server vẫn chơi tới hết ván', () => {
    const rng = testRng(3)
    const room = createRoom('ABC234', 'quick', 4, 0)
    joinRoom(room, { name: 'An', skin: '' }, TOKENS[0], 0, rng)
    let now = NET.quickWaitSec * 1000
    for (let i = 0; i < 20_000 && room.game?.phase !== 'finished'; i++) {
      now += 5000
      tick(room, now, rng)
    }
    expect(room.game?.phase).toBe('finished')
  })
})

describe('API chơi online (2 người chơi giả lập, kho bộ nhớ)', () => {
  function setup() {
    let now = 1_000_000
    const api = createApi(memoryStore(), { now: () => now, rng: testRng(7) })
    const post = async <T>(body: Record<string, unknown>) => {
      const r = await api('POST', new URLSearchParams(), body)
      if (r.status !== 200) throw new Error((r.body as { error: string }).error)
      return r.body as T
    }
    const poll = async (code: string, token: string, since: number) => {
      const r = await api('GET', new URLSearchParams({ code, token, since: String(since) }), null)
      return r
    }
    return { api, post, poll, advance: (ms: number) => (now += ms) }
  }

  it('tạo phòng, vào bằng mã, chủ phòng bắt đầu; ý định của người chưa tới lượt bị từ chối', async () => {
    const { post } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: 'cat', capacity: 3 })
    expect(a.code).toMatch(new RegExp(`^[${NET.codeAlphabet}]{6}$`))
    const b = await post<JoinResponse>({ op: 'join', code: a.code.toLowerCase(), name: 'Bình', skin: 'dog' })
    expect(b.view.lobby.seats).toHaveLength(2)
    await expect(post({ op: 'start', code: a.code, token: b.token })).rejects.toThrow('chủ phòng')
    const started = await post<RoomView>({ op: 'start', code: a.code, token: a.token })
    expect(started.game?.you).toBe('p1')
    await expect(post({ op: 'intent', code: a.code, token: b.token, action: { type: 'ROLL_DICE' }, since: 0 })).rejects.toThrow('Chưa tới lượt')
    // playerId giả trong ý định bị bỏ qua: server gán theo khóa ghế.
    const rolled = await post<RoomView>({ op: 'intent', code: a.code, token: a.token, action: { type: 'ROLL_DICE', playerId: 'p2' }, since: 0 })
    expect(rolled.game?.events[0]).toMatchObject({ type: 'DICE_ROLLED', playerId: 'p1' })
  })

  it('người kia hỏi server thì nhận đúng các event mới (không gửi lại toàn bộ)', async () => {
    const { post, poll } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    const first = (await poll(a.code, b.token, -1)).body as RoomView
    expect(first.game?.full).toBe(true)
    const seq = first.game?.seq ?? 0
    await post({ op: 'intent', code: a.code, token: a.token, action: { type: 'ROLL_DICE' }, since: seq })
    const next = (await poll(a.code, b.token, seq)).body as RoomView
    expect(next.game?.full).toBe(false)
    expect(next.game?.from).toBe(seq)
    expect(next.game?.events.map((e) => e.type)).toContain('DICE_ROLLED')
  })

  it('hết giờ lượt thì server tự tung khi có người hỏi', async () => {
    const { post, poll, advance } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    const view = (await poll(a.code, a.token, -1)).body as RoomView
    expect(view.deadline?.playerId).toBe('p1')
    // Cả hai vẫn hỏi đều (không mất kết nối) nhưng An không bấm gì.
    for (let t = 0; t < ECONOMY.turnTimeLimitSec + 3; t++) {
      advance(1000)
      await poll(a.code, a.token, -1)
      await poll(a.code, b.token, -1)
    }
    const after = (await poll(a.code, b.token, -1)).body as RoomView
    expect(after.game?.state.turn.dice).not.toBeNull()
  })

  it('mất kết nối: bot chơi thay; quay lại thì nhận lại toàn bộ ván; quá 60 giây vẫn giữ ghế, bấm Tắt bot để chơi tiếp', async () => {
    const { post, poll, advance } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    // An im lặng, chỉ Bình hỏi server.
    for (let t = 0; t < NET.disconnectSec + 6; t++) {
      advance(1000)
      await poll(a.code, b.token, -1)
    }
    const mid = (await poll(a.code, b.token, -1)).body as RoomView
    expect(mid.lobby.seats[0].connected).toBe(false)
    expect(mid.game?.state.turn.dice ?? mid.game?.state.currentPlayerIndex).not.toBeNull()
    const back = (await poll(a.code, a.token, -1)).body as RoomView
    expect(back.game?.full).toBe(true)
    expect(back.game?.you).toBe('p1')
    // Lại im lặng quá 60 giây.
    for (let t = 0; t < NET.reconnectSec + 5; t += 5) {
      advance(5000)
      await poll(a.code, b.token, -1)
    }
    const taken = await poll(a.code, a.token, -1)
    expect(taken.status).toBe(200)
    const view = taken.body as RoomView
    expect(view.lobby.seats[0].kind).toBe('bot')
    // Bot đang chơi thay: ý định bị từ chối cho tới khi tắt bot.
    await expect(post({ op: 'intent', code: a.code, token: a.token, actions: [{ type: 'ROLL_DICE' }], since: -1 })).rejects.toThrow('bot')
    const resumed = await post<RoomView>({ op: 'resume', code: a.code, token: a.token })
    expect(resumed.lobby.seats[0]).toMatchObject({ kind: 'human', connected: true })
    expect(resumed.game?.full).toBe(true)
    // Tự thoát thì khóa ghế cũ hết hiệu lực (vào lại bằng mã phòng từ cùng trình duyệt thì nhận lại ghế — test bên dưới).
    await post({ op: 'leave', code: a.code, token: a.token })
    expect((await poll(a.code, a.token, -1)).status).toBe(403)
  })

  it('ghép nhanh: 2 người vào cùng một bàn chờ; mã sai báo không tìm thấy', async () => {
    const { post, api } = setup()
    const a = await post<JoinResponse>({ op: 'quick', name: 'An', skin: '' })
    const b = await post<JoinResponse>({ op: 'quick', name: 'Bình', skin: '' })
    expect(b.code).toBe(a.code)
    expect(b.view.lobby.quickRemainingMs).not.toBeNull()
    const wrong = await api('POST', new URLSearchParams(), { op: 'join', code: 'ZZZZZZ', name: 'x', skin: '' })
    expect(wrong.status).toBe(404)
  })

  it('người chơi chỉ được hỏi khi thật sự phải quyết định', async () => {
    const { post, poll, advance } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    await post({ op: 'intent', code: a.code, token: a.token, action: { type: 'ROLL_DICE' }, since: 0 })
    for (let t = 0; t < 10; t++) {
      advance(1000)
      await poll(a.code, a.token, -1)
      await poll(a.code, b.token, -1)
    }
    const game = ((await poll(a.code, a.token, -1)).body as RoomView).game?.state
    if (!game) throw new Error('chưa có ván')
    expect(game.turn.step).not.toBe('MOVE')
    expect(humanPrompt(game, game.players[game.currentPlayerIndex].id)).not.toBeNull()
  })

  it('số vòng chủ phòng chọn được áp vào ván; số lạ thì dùng mặc định', async () => {
    const { post } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2, maxRounds: 70 })
    expect(a.view.lobby.maxRounds).toBe(70)
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    expect(b.view.game?.state.maxRounds).toBe(70)
    const c = await post<JoinResponse>({ op: 'create', name: 'Chi', skin: '', capacity: 2, maxRounds: 999 })
    expect(c.view.lobby.maxRounds).toBe(ECONOMY.maxRounds)
  })

  it('phòng đủ người: người vào sau thành người xem, thấy ván nhưng không chơi được, rời thì mất khỏi danh sách', async () => {
    const { post, poll } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    const w = await post<JoinResponse>({ op: 'join', code: a.code, name: 'An', skin: '' })
    expect(w.view.lobby.spectating).toBe(true)
    expect(w.view.lobby.you).toBe(-1)
    expect(w.view.game?.you).toBeNull()
    expect(w.view.lobby.spectators).toEqual(['An 2'])
    expect(w.view.game?.state.players).toHaveLength(2)
    await expect(post({ op: 'intent', code: a.code, token: w.token, action: { type: 'ROLL_DICE' }, since: 0 })).rejects.toThrow('đang xem')
    const seen = (await poll(a.code, w.token, -1)).body as RoomView
    expect(seen.game?.full).toBe(true)
    const host = (await poll(a.code, a.token, -1)).body as RoomView
    expect(host.lobby.spectators).toEqual(['An 2'])
    await post({ op: 'leave', code: a.code, token: w.token })
    expect((await poll(a.code, w.token, -1)).status).toBe(403)
  })

  it('ghép nhanh không đưa người vào xem (bàn đầy thì mở bàn mới)', () => {
    const rng = testRng()
    const room = createRoom('ABC234', 'quick', 4, 0)
    for (let i = 0; i < 4; i++) joinRoom(room, { name: `N${i}`, skin: '' }, TOKENS[i], 0, rng)
    expect(() => joinRoom(room, { name: 'X', skin: '' }, 'e'.repeat(32), 0, rng)).toThrow()
  })

  it('người đang chơi hỏi server đều đặn thì luôn là người (không bị bot chơi thay) dù bot liên tục đi', async () => {
    const { post, poll, advance } = setup()
    const me = await post<JoinResponse>({ op: 'quick', name: 'An', skin: '' })
    advance((NET.quickWaitSec + 1) * 1000)
    let since = -1
    let myTurns = 0
    for (let i = 0; i < 150; i++) {
      advance(NET.pollMs)
      const view = (await poll(me.code, me.token, since)).body as RoomView
      expect(view.lobby.seats[0]).toMatchObject({ kind: 'human', connected: true })
      const game = view.game
      if (!game) continue
      since = game.seq
      const prompt = humanPrompt(game.state, game.you)
      if (prompt) {
        // Người chơi quyết định (ở đây chọn phương án hết giờ) — server phải nhận, không báo "chưa tới lượt".
        myTurns++
        const action = getTimeoutAction(game.state)
        if (action) {
          const { playerId: _p, ...intentAction } = action
          await post({ op: 'intent', code: me.code, token: me.token, action: intentAction, since })
        }
      }
      if (game.state.phase !== 'playing') break
    }
    expect(myTurns).toBeGreaterThan(2)
  })

  it('một lần bấm Mua đất + xây nhà + kết thúc lượt: server áp đúng thứ tự trong một yêu cầu', async () => {
    const { post, poll, advance } = setup()
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2 })
    const b = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '' })
    void b
    // Tung cho tới khi An dừng ở một ô mua được (tối đa vài lượt), mỗi lần bấm là một yêu cầu.
    for (let guard = 0; guard < 60; guard++) {
      advance(5000)
      const view = (await poll(a.code, a.token, -1)).body as RoomView
      const game = view.game
      if (!game) continue
      const prompt = humanPrompt(game.state, game.you)
      if (!prompt) continue
      if (prompt.kind === 'BUY') {
        const tile = prompt.tileIndex
        const before = game.state.players[0].money
        const after = await post<RoomView>({ op: 'intent', code: a.code, token: a.token, actions: [{ type: 'BUY' }, { type: 'END_TURN' }], since: game.seq })
        const state = after.game?.state
        expect(state?.tiles[tile].owner).toBe('p1')
        expect(state?.players[0].money).toBeLessThan(before)
        expect(state?.players[0].money).toBeGreaterThanOrEqual(0)
        const types = after.game?.events.map((e) => e.type) ?? []
        expect(types).toContain('PROPERTY_BOUGHT')
        // Kết thúc lượt đã được áp sau khi mua (sang người kế, hoặc được tung thêm nếu vừa ra đôi).
        expect(types.some((t) => t === 'TURN_STARTED' || t === 'EXTRA_ROLL')).toBe(true)
        return
      }
      const action = getTimeoutAction(game.state)
      if (action) {
        const { playerId: _p, ...rest } = action
        await post({ op: 'intent', code: a.code, token: a.token, actions: [rest], since: game.seq }).catch(() => undefined)
      }
    }
    throw new Error('Không gặp ô mua được')
  })

  it('mất khóa ghế (máy tính tắt tab…): nhập lại mã phòng cùng trình duyệt thì nhận lại đúng ghế, không thành người xem', async () => {
    const { post } = setup()
    const idA = 'client-aaaaaaaaaaaaaaaa'
    const idB = 'client-bbbbbbbbbbbbbbbb'
    const a = await post<JoinResponse>({ op: 'create', name: 'An', skin: '', capacity: 2, clientId: idA })
    await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '', clientId: idB })
    const again = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '', clientId: idB })
    expect(again.view.lobby.spectating).toBe(false)
    expect(again.view.lobby.you).toBe(1)
    expect(again.view.game?.you).toBe('p2')
    expect(again.view.lobby.seats).toHaveLength(2)
    // Người lạ (khác trình duyệt) vào bằng mã thì vẫn là người xem.
    const other = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '', clientId: 'client-cccccccccccccccc' })
    expect(other.view.lobby.spectating).toBe(true)
    // Đã bấm Thoát rồi vào lại: nhận lại ghế, bot chơi thay tới khi bấm Tắt bot.
    await post({ op: 'leave', code: a.code, token: again.token })
    const back = await post<JoinResponse>({ op: 'join', code: a.code, name: 'Bình', skin: '', clientId: idB })
    expect(back.view.lobby.you).toBe(1)
    expect(back.view.lobby.seats[1].kind).toBe('bot')
    const resumed = await post<RoomView>({ op: 'resume', code: a.code, token: back.token })
    expect(resumed.lobby.seats[1].kind).toBe('human')
  })

  it('kiểm tra sống trả về loại kho', async () => {
    const { api } = setup()
    const r = await api('GET', new URLSearchParams({ op: 'health' }), null)
    expect(r.body).toEqual({ ok: true, storage: 'memory', onlineReady: true })
  })
})

describe('Tài khoản', () => {
  function setup() {
    let now = 2_000_000
    const api = createApi(memoryStore(), { now: () => now, rng: testRng(11) })
    const post = async <T>(body: Record<string, unknown>) => {
      const r = await api('POST', new URLSearchParams(), body)
      if (r.status !== 200) throw new Error((r.body as { error: string }).error)
      return r.body as T
    }
    return { post, advance: (ms: number) => (now += ms) }
  }

  it('đăng ký, trùng tên bị từ chối, đăng nhập sai/đúng mật khẩu, đăng xuất', async () => {
    const { post } = setup()
    const reg = await post<AuthResponse>({ op: 'register', username: 'Duy_01', password: 'matkhau1', name: 'Duy' })
    expect(reg.account).toEqual({ username: 'duy_01', name: 'Duy' })
    await expect(post({ op: 'register', username: 'duy_01', password: 'khac123' })).rejects.toThrow('đã có')
    await expect(post({ op: 'register', username: 'a', password: 'matkhau1' })).rejects.toThrow('Tên đăng nhập')
    await expect(post({ op: 'register', username: 'ngan', password: '123' })).rejects.toThrow('Mật khẩu')
    await expect(post({ op: 'login', username: 'duy_01', password: 'sai-mat-khau' })).rejects.toThrow('Sai')
    const login = await post<AuthResponse>({ op: 'login', username: 'DUY_01', password: 'matkhau1' })
    expect((await post<MeResponse>({ op: 'me', auth: login.token })).account?.name).toBe('Duy')
    await post({ op: 'logout', auth: login.token })
    expect((await post<MeResponse>({ op: 'me', auth: login.token })).account).toBeNull()
    expect((await post<MeResponse>({ op: 'me', auth: reg.token })).account?.username).toBe('duy_01')
  })

  it('đăng nhập ở máy khác vẫn vào lại đúng ghế; "me" báo phòng đang chơi; trình duyệt không giả được mã tài khoản', async () => {
    const { post } = setup()
    const duy = await post<AuthResponse>({ op: 'register', username: 'duy', password: 'matkhau1', name: 'Duy' })
    const lan = await post<AuthResponse>({ op: 'register', username: 'lan', password: 'matkhau2', name: 'Lan' })
    const a = await post<JoinResponse>({ op: 'create', name: 'x', skin: '', capacity: 2, auth: duy.token, clientId: 'browser-aaaaaaaaaaaaaaaa' })
    expect(a.view.lobby.seats[0].name).toBe('Duy')
    await post<JoinResponse>({ op: 'join', code: a.code, name: 'y', skin: '', auth: lan.token })
    // Máy khác: đăng nhập lại (khóa phiên mới), trình duyệt khác.
    const other = await post<AuthResponse>({ op: 'login', username: 'duy', password: 'matkhau1' })
    const me = await post<MeResponse>({ op: 'me', auth: other.token })
    expect(me.activeRoom).toBe(a.code)
    const back = await post<JoinResponse>({ op: 'join', code: a.code, name: 'z', skin: '', auth: other.token, clientId: 'browser-bbbbbbbbbbbbbbbb' })
    expect(back.view.lobby.spectating).toBe(false)
    expect(back.view.game?.you).toBe('p1')
    // Không đăng nhập mà khai mã tài khoản: thành người xem.
    const fake = await post<JoinResponse>({ op: 'join', code: a.code, name: 'z', skin: '', clientId: 'user-duy-aaaaaaaaaaaaa' })
    expect(fake.view.lobby.spectating).toBe(true)
  })
})

describe('Nhận biến môi trường Redis', () => {
  it('nhận tên chuẩn, tên của Vercel KV và tên có tiền tố riêng; bỏ token chỉ đọc', () => {
    expect(redisCredentials({ UPSTASH_REDIS_REST_URL: 'https://a', UPSTASH_REDIS_REST_TOKEN: 't' })).toEqual({ url: 'https://a', token: 't' })
    expect(redisCredentials({ KV_REST_API_URL: 'https://b', KV_REST_API_TOKEN: 't' })).toEqual({ url: 'https://b', token: 't' })
    expect(
      redisCredentials({ BELLA_KV_REST_API_URL: 'https://c', BELLA_KV_REST_API_TOKEN: 't', BELLA_KV_REST_API_READ_ONLY_TOKEN: 'r' }),
    ).toEqual({ url: 'https://c', token: 't' })
    expect(redisCredentials({ REDIS_URL: 'rediss://x' })).toBeNull()
  })
})

describe('Bản bundle cho Vercel', () => {
  it('api/estate.js khớp với mã nguồn hiện tại (chạy `npm run build:api` sau khi sửa src/online)', async () => {
    const { build } = await import('esbuild')
    const { apiBuildOptions } = await import('../../scripts/build-api.mjs')
    const out = await build({ ...apiBuildOptions, write: false, outfile: 'api/estate.js' })
    const fresh = out.outputFiles[0].text
    expect(readFileSync('api/estate.js', 'utf8')).toBe(fresh)
  })
})
