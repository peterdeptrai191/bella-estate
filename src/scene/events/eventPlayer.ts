/**
 * Event player: biến từng event của game-core thành animation + âm thanh, rồi cập nhật view.
 * Mỗi handler trả về Promise; EventPlayer.tsx phát tuần tự theo hàng đợi.
 *
 * Quy tắc: view chỉ được đổi qua `applyToView` (dùng chung reducer thuần boardView.ts),
 * nên phát xong mọi event thì màn hình luôn khớp state của game-core.
 */
import { Vector3 } from 'three'
import { playSound } from '../../audio/soundPlayer'
import type { GameEvent, PlayerId } from '../../game-core'
import { BOARD_SIZE } from '../../config/board'
import { useAnimationStore } from '../../store/animationStore'
import { useVisualStore } from '../../store/visualStore'
import { centerTopY, computeTileLayout, piecePlacement } from '../boardLayout'
import { followPiece } from '../cameraControl'
import { rollDice } from '../diceControl'
import { flyCoins } from '../fxControl'
import { arcTo, beginControl, endControl, pieceObject, teleportTo, vanish } from '../pieceControl'

const wait = (seconds: number) => new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))

const visual = () => useVisualStore.getState().visual
const apply = (event: GameEvent) => useAnimationStore.getState().applyToView(event)

/** Chỗ đứng của quân `id` theo view hiện tại. */
function restingSpot(id: PlayerId): [number, number] | null {
  const view = useAnimationStore.getState().view
  if (!view) return null
  const v = visual()
  return piecePlacement(view.players, computeTileLayout(v.board), v.pieces).get(id) ?? null
}

/** Điểm trên đầu quân cờ (chỗ tiền bay ra/vào). Người nhận là ngân hàng thì ở giữa bàn. */
function moneyPoint(id: PlayerId | null): Vector3 {
  const v = visual()
  const object = id ? pieceObject(id) : undefined
  if (!object) return new Vector3(0, centerTopY(v.board) + 0.4, 0)
  return object.getWorldPosition(new Vector3()).add(new Vector3(0, v.pieces.height * 0.8, 0))
}

async function coins(from: PlayerId | null, to: PlayerId | null, event: GameEvent) {
  const start = moneyPoint(from)
  const end = moneyPoint(to)
  await flyCoins(start, end, (i) => playSound('coin', { pitch: 1 + i * 0.06 }))
  apply(event)
}

async function movePiece(event: Extract<GameEvent, { type: 'PLAYER_MOVED' }>) {
  const { playerId, from, mode } = event
  beginControl(playerId)
  followPiece(pieceObject(playerId) ?? null)
  try {
    if (mode === 'WALK') {
      // Nhảy từng ô; cập nhật view từng bước để các quân khác xếp lại chỗ.
      for (let k = 1; k <= event.steps; k++) {
        const tile = (from + k) % BOARD_SIZE
        apply({ ...event, from: (from + k - 1) % BOARD_SIZE, to: tile, steps: 1 })
        const spot = restingSpot(playerId)
        playSound('hop', { pitch: 0.95 + (k % 4) * 0.05 })
        if (spot) await arcTo(playerId, spot[0], spot[1], 'hop')
      }
    } else {
      apply(event)
      const spot = restingSpot(playerId)
      if (mode === 'FLY') {
        playSound('fly')
        if (spot) await arcTo(playerId, spot[0], spot[1], 'fly')
      } else if (spot) {
        await teleportTo(playerId, spot[0], spot[1])
      }
    }
  } finally {
    endControl(playerId)
    followPiece(null)
  }
}

export async function playEvent(event: GameEvent): Promise<void> {
  const a = visual().animation
  switch (event.type) {
    case 'TURN_STARTED':
      apply(event)
      playSound('turnStart')
      await wait(a.turnPause)
      return
    case 'DICE_ROLLED':
      await rollDice(event.dice)
      apply(event)
      return
    case 'PLAYER_MOVED':
      await movePiece(event)
      return
    case 'PASSED_START':
      playSound('passStart')
      await coins(null, event.playerId, event)
      return
    case 'PROPERTY_BOUGHT':
      playSound('buy')
      apply(event)
      await wait(a.buildDuration)
      return
    case 'BUILT':
      playSound('build')
      apply(event)
      await wait(a.buildDuration)
      return
    case 'RENT_PAID':
      await coins(event.from, event.to, event)
      return
    case 'BOUGHT_OUT':
      await coins(event.playerId, event.from, event)
      playSound('buy')
      await wait(a.buildDuration)
      return
    case 'MONEY_PAID':
      await coins(event.from, event.to, event)
      return
    case 'MONEY_RECEIVED':
      playSound('passStart')
      await coins(null, event.playerId, event)
      return
    case 'CARD_DRAWN':
      playSound('card')
      await wait(a.cardPause)
      return
    case 'SENT_TO_ISLAND':
      playSound('island')
      return
    case 'FESTIVAL_HOSTED':
      playSound('festival')
      apply(event)
      await wait(a.cardPause / 2)
      return
    case 'HOUSE_DESTROYED':
      playSound('earthquake')
      apply(event)
      await wait(a.cardPause / 2)
      return
    case 'PROPERTY_SOLD':
      playSound('sold')
      apply(event)
      await wait(a.cardPause / 2)
      return
    case 'BANKRUPT':
      playSound('bankrupt')
      await vanish(event.playerId)
      apply(event)
      return
    case 'GAME_OVER':
      playSound('gameOver')
      apply(event)
      return
    default:
      apply(event)
  }
}
