/** Ván offline: bạn + 3 bot (GDD: MVP chơi offline với 1–3 bot). */
import { useGameStore } from '../store/gameStore'
import { useUiStore } from '../store/uiStore'

const PLAYERS = [
  { name: 'Bạn', isBot: false },
  { name: 'Minh', isBot: true },
  { name: 'Lan', isBot: true },
  { name: 'Tuấn', isBot: true },
]

export function startNewMatch(seed?: number): void {
  const ui = useUiStore.getState()
  ui.selectTile(null)
  ui.setPick(null)
  ui.closeCard()
  useGameStore.getState().startGame(PLAYERS, seed ?? Date.now())
}
