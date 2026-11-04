/** Bấm vào ô bất kỳ: chủ sở hữu, cấp nhà, tiền thuê hiện tại (lấy theo view đang hiển thị). */
import { BOARD, COLOR_GROUPS, type TileKind } from '../../config/board'
import { ECONOMY } from '../../config/economy'
import { buyoutPrice, formatMoney, LANDMARK_LEVEL, rentFor, type Ownership } from '../../game-core'
import { useAnimationStore } from '../../store/animationStore'
import { useUiStore } from '../../store/uiStore'
import { useVisual } from '../../store/visualStore'
import { LevelIcon, Modal, Money } from '../kit'

const LEVEL_NAMES = ['Đất trống', '1 nhà', '2 nhà', '3 nhà', 'Landmark']

const SPECIAL_TEXT: Partial<Record<TileKind, string>> = {
  START: `Đi qua nhận ${formatMoney(ECONOMY.passStartBonus)}. Dừng đúng ô được xây 1 nhà miễn phí.`,
  ISLAND: `Bị kẹt tối đa ${ECONOMY.island.maxTurns} lượt. Thoát bằng cách tung đôi, trả ${formatMoney(ECONOMY.island.escapeFee)} hoặc dùng thẻ Ra Đảo.`,
  FESTIVAL: `Dừng ở đây: chọn một thành phố của bạn tổ chức Lễ Hội, tiền thuê x${ECONOMY.festivalRentMultiplier}.`,
  AIRPORT: `Lượt sau được bay tới bất kỳ ô nào (phí ${formatMoney(ECONOMY.airport.flightFee)}).`,
  CHANCE: 'Rút một thẻ Cơ Hội.',
  TAX: `Nộp ${Math.round(ECONOMY.taxRate * 100)}% tổng tài sản cho ngân hàng.`,
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[1rem] border-b border-dashed border-stone-200 py-[0.2rem] text-[1.05rem] last:border-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-extrabold text-ink">{children}</span>
    </div>
  )
}

export function TileInfo() {
  const selected = useUiStore((s) => s.selectedTile)
  const close = () => useUiStore.getState().selectTile(null)
  const view = useAnimationStore((s) => s.view)
  const { playerColors } = useVisual()
  if (selected === null || !view) return null

  const def = BOARD[selected]
  const tile = view.tiles[selected]
  const ownership: Ownership = view
  const ownerView = view.players.find((p) => p.id === tile.owner)
  const ownerColor = ownerView ? playerColors[ownerView.seat % playerColors.length] : '#bdb5aa'
  const group = COLOR_GROUPS.find((g) => g.id === def.group)
  // Màu nhóm nhạt: pha tối đi để chữ trắng trên ruy băng dễ đọc.
  const ribbon = group ? `color-mix(in srgb, ${group.color} 72%, #1d3b5a)` : '#2fa7e6'
  const isProperty = def.kind === 'CITY' || def.kind === 'RESORT'

  /** Tiền thuê cơ bản ở từng cấp (chưa tính nhóm màu / Lễ Hội), tính bằng chính hàm của game-core. */
  const rentAtLevel = (level: number) => {
    const tiles = view.tiles.map((_, i) => (i === selected ? { owner: '_', level } : { owner: null, level: 0 }))
    return rentFor({ tiles, festivalTile: null }, selected)
  }

  return (
    <Modal title={def.name} ribbon={ribbon} onClose={close} onBackdrop={close} layer="z-40" className="w-[24rem]">
          {isProperty && (
            <div className="mb-[0.5rem] flex items-center gap-[0.8rem]">
              <div className="w-[8rem] shrink-0 rounded-xl bg-gradient-to-b from-sky-100 to-white">
                <LevelIcon level={def.kind === 'RESORT' ? -1 : tile.level} color={ownerColor} className="h-[5.2rem] w-full" />
              </div>
              <div className="leading-tight">
                <div className="text-[0.95rem] text-stone-500">{def.kind === 'RESORT' ? 'Khu Du Lịch' : `Nhóm ${group?.name ?? ''}`}</div>
                <div className="text-[1.25rem] font-extrabold" style={{ color: ownerView ? ownerColor : undefined }}>
                  {ownerView ? ownerView.name : 'Chưa có chủ'}
                </div>
                {def.kind === 'CITY' && tile.owner && <div className="text-[1rem] text-stone-500">{LEVEL_NAMES[tile.level]}</div>}
                {view.festivalTile === selected && <div className="text-[1rem] font-bold text-pink-500">🎉 Đang có Lễ Hội</div>}
              </div>
            </div>
          )}
          {isProperty ? (
            <div>
              {tile.owner && (
                <Row label="Tiền thuê hiện tại">
                  <Money amount={rentFor(ownership, selected)} />
                </Row>
              )}
              <Row label="Giá đất">
                <Money amount={def.price ?? 0} />
              </Row>
              {tile.owner && tile.level < LANDMARK_LEVEL && (
                <Row label="Giá mua lại">
                  <Money amount={buyoutPrice(ownership, selected)} />
                </Row>
              )}
              {tile.owner && tile.level >= LANDMARK_LEVEL && <Row label="Mua lại">Không thể (Landmark)</Row>}
              <div className="mt-[0.5rem] grid grid-cols-5 gap-[0.3rem] text-center">
                {def.kind === 'CITY'
                  ? [0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`rounded-lg py-[0.2rem] ${tile.owner && tile.level === level ? 'bg-sky-100 ring-2 ring-sky-300' : 'bg-white'}`}
                      >
                        <div className="text-[0.75rem] text-stone-400">{level === 0 ? 'Đất' : level === 4 ? 'LM' : `${level} nhà`}</div>
                        <div className="text-[0.85rem] font-extrabold">{formatMoney(rentAtLevel(level))}</div>
                      </div>
                    ))
                  : ECONOMY.resort.rentByCount.slice(1).map((rent, k) => (
                      <div key={k} className="rounded-lg bg-white py-[0.2rem]">
                        <div className="text-[0.75rem] text-stone-400">{k + 1} khu</div>
                        <div className="text-[0.85rem] font-extrabold">{formatMoney(rent)}</div>
                      </div>
                    ))}
              </div>
              {def.kind === 'CITY' && (
                <p className="mt-[0.4rem] text-center text-[0.85rem] text-stone-400">
                  Gom đủ nhóm màu: tiền thuê x{ECONOMY.colorGroupRentMultiplier}
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-[1.15rem] leading-snug text-stone-600">{SPECIAL_TEXT[def.kind]}</p>
          )}
    </Modal>
  )
}
