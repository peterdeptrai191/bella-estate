/** Chơi thử tạm thời: người chơi chọn ngẫu nhiên (chưa phải bot AI GDD mục 7). */
import { currentPlayer } from '../game-core'
import { createRandomPlayer, nextRandomAction } from '../game-core/randomPlayer'
import { useGameStore } from '../store/gameStore'

const policy = createRandomPlayer(Date.now() & 0xffff)

const NAMES = ['An', 'Bình', 'Chi', 'Dũng']

export function startNewGame(): void {
  useGameStore.getState().startGame(NAMES.map((name, i) => ({ name, isBot: i > 0 })))
}

/** Chơi hết lượt của người hiện tại (gồm cả lượt tung thêm khi ra đôi) — dispatch ngay, không chờ animation. */
export function playOneTurn(): void {
  const store = useGameStore.getState()
  let game = store.game
  if (!game || game.phase !== 'playing') return
  const startId = currentPlayer(game).id
  for (let guard = 0; guard < 200; guard++) {
    const action = nextRandomAction(game, policy)
    if (!action) return
    store.dispatch(action)
    game = useGameStore.getState().game
    if (!game || game.phase !== 'playing' || currentPlayer(game).id !== startId) return
  }
}
