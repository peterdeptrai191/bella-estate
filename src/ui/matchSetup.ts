/** Bắt đầu / chơi lại / thoát ván — nối các màn hình với store. */
import type { BotLevel } from '../config/bots'
import { useAnimationStore } from '../store/animationStore'
import { useGameStore } from '../store/gameStore'
import { leaveRoom } from '../store/net'
import { displayName, useProfileStore } from '../store/profileStore'
import { useUiStore, type Screen } from '../store/uiStore'

function clearUi() {
  const ui = useUiStore.getState()
  ui.selectTile(null)
  ui.setPick(null)
  ui.closeCard()
  ui.setDeadline(null)
}

/** Ván offline: bạn + 1–3 bot (GDD: MVP chơi offline với 1–3 bot). */
export function startBotMatch(bots: number, level: BotLevel, seed?: number): void {
  clearUi()
  const profile = useProfileStore.getState()
  useGameStore.getState().startOffline({ name: displayName(profile.name), skin: profile.skin, bots, level }, seed ?? Date.now())
  useUiStore.getState().setScreen('game')
}

/** Chơi lại với cùng thiết lập (offline), hoặc quay lại màn hình chơi cùng bạn (online). */
export function playAgain(): void {
  const { mode, offlineConfig } = useGameStore.getState()
  if (mode === 'offline' && offlineConfig) {
    startBotMatch(offlineConfig.bots, offlineConfig.level)
    return
  }
  void exitToMenu('friends')
}

export async function exitToMenu(screen: Screen = 'home'): Promise<void> {
  clearUi()
  if (useGameStore.getState().mode === 'online') await leaveRoom()
  useGameStore.getState().reset()
  useAnimationStore.getState().clear()
  useUiStore.getState().setScreen(screen)
}
