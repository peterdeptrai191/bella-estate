/** Ngữ cảnh nội bộ khi xử lý một action: bản sao state đang được sửa + danh sách event. */
import { nextRandom, toDie } from './rng'
import type { GameEvent, GameState, Player, PlayerId } from './types'

/** Action không hợp lệ theo luật. Server/UI bắt lỗi này để từ chối action. */
export class GameRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GameRuleError'
  }
}

export interface Ctx {
  /** Bản sao của state đầu vào — chỉ bản sao này được sửa. */
  s: GameState
  events: GameEvent[]
}

export function emit(ctx: Ctx, event: GameEvent): void {
  ctx.events.push(event)
}

export function random(ctx: Ctx): number {
  const [value, next] = nextRandom(ctx.s.rngState)
  ctx.s.rngState = next
  return value
}

export function rollDie(ctx: Ctx): number {
  return toDie(random(ctx))
}

export function currentPlayer(s: GameState): Player {
  return s.players[s.currentPlayerIndex]
}

export function playerById(s: GameState, id: PlayerId): Player {
  const player = s.players.find((p) => p.id === id)
  if (!player) throw new GameRuleError(`Không có người chơi ${id}`)
  return player
}

export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new GameRuleError(message)
}
