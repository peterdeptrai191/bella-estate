/** Bảng luật chơi rút gọn (nút ? trên thanh trên cùng). Con số lấy từ config, không ghi cứng. */
import { useState } from 'react'
import { CARDS, type CardId } from '../../config/cards'
import { ECONOMY } from '../../config/economy'
import { formatMoney } from '../../game-core'
import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { Modal } from '../kit'

type Tab = 'win' | 'turn' | 'tiles' | 'cards'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'win', label: 'Cách thắng' },
  { id: 'turn', label: 'Một lượt' },
  { id: 'tiles', label: 'Các ô' },
  { id: 'cards', label: 'Thẻ Cơ Hội' },
]

const CARD_ORDER: CardId[] = [
  'ESCAPE_ISLAND',
  'DISCOUNT',
  'SHIELD',
  'GO_TO_START',
  'GO_TO_FESTIVAL',
  'EARTHQUAKE',
  'GO_TO_ISLAND',
  'SURPRISE_TAX',
  'CHARITY',
  'LOTTERY',
]

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`
const money = (n: number) => formatMoney(n)

function Item({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-[0.6rem]">
      <span className="mt-[0.05rem] flex h-[2rem] w-[2rem] shrink-0 items-center justify-center rounded-full bg-sky-100 text-[1.1rem]">{icon}</span>
      <span>
        <b className="text-ink">{title}</b>
        <span className="block text-stone-500">{children}</span>
      </span>
    </li>
  )
}

export function HelpPopup() {
  const open = useUiStore((s) => s.helpOpen)
  const maxRounds = useGameStore((s) => s.game?.maxRounds) || ECONOMY.maxRounds
  const [tab, setTab] = useState<Tab>('win')
  if (!open) return null
  const close = () => useUiStore.setState({ helpOpen: false })
  const E = ECONOMY
  return (
    <Modal title="Luật chơi" onClose={close} onBackdrop={close} className="w-[36rem]" layer="z-50">
      <div className="mb-[0.7rem] flex flex-wrap justify-center gap-[0.35rem]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-[0.9rem] py-[0.2rem] text-[1rem] font-extrabold transition ${
              tab === t.id ? 'bg-sky-500 text-white shadow' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="max-h-[min(24rem,58vh)] overflow-y-auto pr-[0.3rem] text-[1rem] leading-snug">
        {tab === 'win' && (
          <ul className="space-y-[0.6rem]">
            <Item icon="🎨" title={`Độc quyền ${E.win.colorGroupsToWin} nhóm màu`}>
              Sở hữu trọn {E.win.colorGroupsToWin} nhóm màu bất kỳ → thắng ngay.
            </Item>
            <Item icon="📏" title="Độc quyền một cạnh bàn cờ">
              Sở hữu mọi ô mua được trên cùng một cạnh → thắng ngay.
            </Item>
            <Item icon="🏖️" title="Độc quyền 4 Khu Du Lịch">
              Có cả 4 Khu Du Lịch → thắng ngay.
            </Item>
            <Item icon="🏆" title="Người sống sót cuối cùng">
              Mọi đối thủ khác phá sản.
            </Item>
            <Item icon="⏱️" title={`Hết ${maxRounds} vòng`}>
              Ai có tổng tài sản (tiền + giá trị đất, nhà) cao nhất thắng; bằng nhau thì ai nhiều tiền mặt hơn.
            </Item>
          </ul>
        )}
        {tab === 'turn' && (
          <ul className="space-y-[0.6rem]">
            <Item icon="🎲" title="Tung 2 xúc xắc rồi đi">
              Ra đôi được tung thêm lượt; ra đôi {E.dice.maxConsecutiveDoubles} lần liên tiếp thì bị đưa ra Đảo Hoang.
            </Item>
            <Item icon="🏠" title="Mua và xây">
              Dừng ở thành phố trống thì mua đất, kèm luôn nhà nếu muốn; dừng ở thành phố của mình thì xây thêm (nhiều nhà một lúc, không cần đủ bộ màu).
              Vòng đầu (chưa qua Xuất Phát) tối đa {E.city.firstLapMaxHouses} nhà, từ vòng 2 tối đa {E.city.maxHouses} nhà. Ô đã có {E.city.maxHouses} nhà thì lần dừng sau
              lên Landmark. Không mua thì ô vẫn trống.
            </Item>
            <Item icon="💸" title="Trả tiền thuê">
              Dừng trên đất đối thủ thì trả tiền thuê. Trọn bộ màu: tiền thuê mọi ô trong nhóm x{E.colorGroupRentMultiplier}.
            </Item>
            <Item icon="🤝" title="Mua lại đất đối thủ">
              Trả thuê xong được mua lại ô đó với giá x{E.buyoutMultiplier} tổng giá trị đã đầu tư, tiền trả cho chủ cũ. Landmark và Khu Du Lịch không bị mua lại.
            </Item>
            <Item icon="🆘" title="Thiếu tiền">
              Phải bán nhà, đất cho ngân hàng với giá {pct(E.bankSellRatio)} giá trị. Bán hết vẫn thiếu thì phá sản.
            </Item>
            <Item icon="⏳" title={`${E.turnTimeLimitSec} giây mỗi lượt`}>
              Hết giờ thì game tự tung hoặc tự bỏ qua.
            </Item>
          </ul>
        )}
        {tab === 'tiles' && (
          <ul className="space-y-[0.6rem]">
            <Item icon="🏁" title="Xuất Phát">
              Đi qua nhận +{money(E.passStartBonus)}. Dừng đúng ô được xây thêm 1 nhà miễn phí.
            </Item>
            <Item icon="🏝️" title="Đảo Hoang">
              Kẹt tối đa {E.island.maxTurns} lượt. Thoát bằng tung đôi, trả {money(E.island.escapeFee)} hoặc thẻ Ra Đảo.
            </Item>
            <Item icon="🎉" title="Lễ Hội">
              Chọn một thành phố của mình để tổ chức Lễ Hội. Lần đầu tiền thuê x{E.festivalRentMultiplier}, mỗi lần tổ chức sau tăng thêm x{E.festivalRentStep} (tối đa x{E.festivalRentMax}).
            </Item>
            <Item icon="✈️" title="Sân Bay">
              Lượt sau bay tới ô bất kỳ (tốn {money(E.airport.flightFee)}).
            </Item>
            <Item icon="🏖️" title="Khu Du Lịch">
              Giá {money(E.resort.price)}, không xây nhà; càng nhiều khu thì tiền thuê càng cao.
            </Item>
            <Item icon="❓" title="Cơ Hội">
              Rút một thẻ ngẫu nhiên (xem tab Thẻ Cơ Hội).
            </Item>
            <Item icon="🧾" title="Thuế">
              Nộp {pct(E.taxRate)} tổng tài sản.
            </Item>
          </ul>
        )}
        {tab === 'cards' && (
          <ul className="grid grid-cols-2 gap-[0.5rem] max-[520px]:grid-cols-1">
            {CARD_ORDER.map((id) => (
              <li key={id} className="rounded-lg bg-stone-50 px-[0.6rem] py-[0.4rem]">
                <b className="text-ink">{CARDS[id].name}</b>
                <span className="block text-[0.92rem] text-stone-500">{CARDS[id].description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-[0.9rem] flex justify-center">
        <button className="btn-3d btn-blue px-[2.4rem] py-[0.4rem] text-[1.1rem]" onClick={close}>
          Đã hiểu
        </button>
      </div>
    </Modal>
  )
}
