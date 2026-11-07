import { useGameStore } from '../store/gameStore'
import { useOnlineStore } from '../store/onlineStore'

/** Ghế của mình đang do bot chơi thay (online). */
export function useBotTakeover(): boolean {
  const mode = useGameStore((s) => s.mode)
  const playing = useGameStore((s) => s.game?.phase === 'playing')
  const mine = useOnlineStore((s) => (s.lobby && !s.lobby.spectating ? s.lobby.seats[s.lobby.you] : undefined))
  return mode === 'online' && playing && mine?.kind === 'bot'
}
