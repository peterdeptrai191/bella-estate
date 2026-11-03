/**
 * Giả lập 1 ván với người chơi ra quyết định ngẫu nhiên, in log từng lượt.
 *
 *   npm run simulate                      # 4 người, seed ngẫu nhiên
 *   npm run simulate -- --seed 42         # tái lập đúng ván đó
 *   npm run simulate -- --players 3 --quiet
 *
 * Đây KHÔNG phải bot AI (GDD mục 7, phase sau) — chỉ là người chơi ngẫu nhiên để kiểm tra luật.
 */
import { BOARD } from '../src/config/board'
import {
  applyAction,
  createGame,
  currentPlayer,
  describeEvent,
  formatMoney,
  getLegalActions,
  netWorth,
  ownedTiles,
  type GameState,
} from '../src/game-core'
import { createRandomPlayer } from '../src/game-core/randomPlayer'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? args[i + 1] : undefined
  }
  return {
    seed: Number(get('seed') ?? Math.floor(Math.random() * 1_000_000)),
    players: Number(get('players') ?? 4),
    quiet: args.includes('--quiet'),
  }
}

function playerLine(state: GameState): string {
  return state.players
    .map((p) => (p.bankrupt ? `${p.name}: phá sản` : `${p.name}: ${formatMoney(p.money)}`))
    .join(' | ')
}

function main() {
  const { seed, players, quiet } = parseArgs()
  const names = ['An', 'Bình', 'Chi', 'Dũng'].slice(0, players)
  let state = createGame(
    names.map((name) => ({ name, isBot: true })),
    seed,
  )
  const decide = createRandomPlayer(seed)
  const log = (line: string) => {
    if (!quiet) console.log(line)
  }

  console.log(`🎲 Giả lập Bella Monopoly — ${players} người, seed ${seed}`)
  log(`\n━━ Vòng 1 ━━  ${playerLine(state)}`)
  log(`▶ Lượt của ${currentPlayer(state).name}`)

  let steps = 0
  const counts: Record<string, number> = {}
  while (state.phase === 'playing') {
    if (++steps > 50_000) throw new Error('Ván không kết thúc — có lỗi luật')
    const legal = getLegalActions(state)
    const action = decide(state, legal)
    const before = state
    const result = applyAction(state, action)
    state = result.state

    for (const event of result.events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1
      if (event.type === 'TURN_STARTED') {
        if (event.round !== before.round) log(`\n━━ Vòng ${event.round} ━━  ${playerLine(state)}`)
        log(`▶ Lượt của ${describeEvent(event, state).replace(/^Lượt của /, '').replace(/ \(vòng \d+\)$/, '')}`)
        continue
      }
      if (event.type === 'GAME_OVER') continue
      log(`    ${describeEvent(event, state)}`)
    }
  }

  const over = state
  console.log(`\n${'═'.repeat(60)}`)
  console.log(
    describeEvent(
      { type: 'GAME_OVER', winner: over.winner ?? '', reason: over.winReason ?? 'ROUND_LIMIT', standings: [] },
      over,
    ),
  )
  console.log(`Kết thúc ở vòng ${over.round}, ${steps} action`)
  console.log('\nXếp hạng:')
  const ranking = [...over.players].sort(
    (a, b) => Number(a.bankrupt) - Number(b.bankrupt) || netWorth(over, b.id) - netWorth(over, a.id),
  )
  ranking.forEach((p, i) => {
    const tiles = ownedTiles(over, p.id)
      .map((t) => `${BOARD[t].name}${over.tiles[t].level ? `(${over.tiles[t].level === 4 ? 'LM' : over.tiles[t].level})` : ''}`)
      .join(', ')
    const status = p.bankrupt ? 'phá sản' : `tài sản ${formatMoney(netWorth(over, p.id))}, tiền mặt ${formatMoney(p.money)}`
    console.log(`  ${i + 1}. ${p.name} — ${status}${tiles ? `\n     ${tiles}` : ''}`)
  })
  const stat = (k: string) => counts[k] ?? 0
  console.log(
    `\nThống kê: mua ${stat('PROPERTY_BOUGHT')} · xây ${stat('BUILT')} · trả thuê ${stat('RENT_PAID')} · ` +
      `mua lại ${stat('BOUGHT_OUT')} · thẻ ${stat('CARD_DRAWN')} · ra đảo ${stat('SENT_TO_ISLAND')} · ` +
      `bán nợ ${stat('PROPERTY_SOLD')} · phá sản ${stat('BANKRUPT')}`,
  )
}

main()
