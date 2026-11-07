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
import { BOARD } from '../../config/board'
import { useAnimationStore } from '../../store/animationStore'
import { useGameStore } from '../../store/gameStore'
import { useUiStore, type Banner } from '../../store/uiStore'
import { useVisualStore } from '../../store/visualStore'
import { centerTopY, computeTileLayout, piecePlacement } from '../boardLayout'
import { followPiece } from '../cameraControl'
import { rollDice } from '../diceControl'
import { flyCoins } from '../fxControl'
import { arcTo, beginControl, endControl, pieceObject, teleportTo, vanish } from '../pieceControl'

const wait = (seconds: number) => new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))

const visual = () => useVisualStore.getState().visual
const apply = (event: GameEvent) => useAnimationStore.getState().applyToView(event)

/** Người chơi trên máy này (không tính chế độ để bot chơi thay). */
const isLocal = (id: PlayerId) => useGameStore.getState().humanId === id && !useUiStore.getState().autoplayHuman
const nameOf = (id: PlayerId) => useAnimationStore.getState().view?.players.find((p) => p.id === id)?.name ?? id
const banner = (text: string, tone: Banner['tone']) =>
  useUiStore.getState().showBanner(text, tone, visual().animation.bannerDuration)

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
  // Một tràng chip khi tiền bắt đầu bay và một tiếng khi tới nơi (không phát mỗi đồng xu — nghe như tiếng chít).
  playSound('coin')
  const last = visual().animation.coinCount - 1
  await flyCoins(start, end, (i) => {
    if (i === last) playSound('coinLand')
  })
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
        playSound('hop', { jitter: true })
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
      useUiStore.setState({ diceShown: null, targetTile: null })
      apply(event)
      playSound('turnStart')
      if (isLocal(event.playerId)) banner('Lượt của bạn!', 'info')
      await wait(a.turnPause)
      return
    case 'DICE_ROLLED':
      useUiStore.setState({ diceShown: null, targetTile: null })
      await rollDice(event.dice)
      apply(event)
      useUiStore.setState({ diceShown: { dice: event.dice, total: event.dice[0] + event.dice[1] } })
      if (event.isDouble) banner('ĐÔI!', 'double')
      return
    case 'EXTRA_ROLL':
      apply(event)
      banner('Tung thêm lượt!', 'good')
      await wait(a.turnPause)
      return
    case 'PLAYER_MOVED':
      // Viền vàng ô sẽ dừng ngay khi quân bắt đầu đi.
      useUiStore.setState({ targetTile: event.to })
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
      banner('MUA LẠI!', 'good')
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
    case 'CARD_DRAWN': {
      playSound('card')
      const interactive = isLocal(event.playerId)
      await useUiStore
        .getState()
        .showCard({ card: event.card, playerId: event.playerId, interactive }, interactive ? a.cardRevealHuman : a.cardRevealBot)
      apply(event)
      return
    }
    case 'RENT_WAIVED':
      playSound('card')
      banner('Lá Chắn: miễn tiền thuê!', 'good')
      apply(event)
      await wait(a.cardPause / 2)
      return
    case 'SENT_TO_ISLAND':
      playSound('island')
      banner(isLocal(event.playerId) ? 'Bạn ra Đảo Hoang!' : `${nameOf(event.playerId)} ra Đảo Hoang`, 'bad')
      apply(event)
      return
    case 'DEBT_STARTED':
      playSound('island')
      if (isLocal(event.playerId)) banner('Không đủ tiền! Hãy bán tài sản', 'bad')
      apply(event)
      await wait(a.cardPause)
      return
    case 'FESTIVAL_HOSTED':
      playSound('festival')
      banner(`Lễ Hội ở ${BOARD[event.tileIndex].name}!`, 'good')
      apply(event)
      await wait(a.cardPause / 2)
      return
    case 'EARTHQUAKE_NO_TARGET':
      banner('Đối thủ chưa có nhà để phá', 'info')
      apply(event)
      await wait(a.cardPause)
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
      banner(`${nameOf(event.playerId)} PHÁ SẢN`, 'bad')
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
