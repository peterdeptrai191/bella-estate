/** Màn hình: thiết lập chơi với bot, chọn bản đồ (coming soon), cửa hàng skin. */
import { useState } from 'react'
import { BOT_LEVEL_NAMES, BOT_LEVELS, type BotLevel } from '../../config/bots'
import { META, SKINS, skinById, type SkinDef } from '../../config/skins'
import { formatMoney } from '../../game-core'
import { useProfileStore } from '../../store/profileStore'
import { useUiStore } from '../../store/uiStore'
import { playSound, unlockAudio } from '../../audio/soundPlayer'
import { CoinIcon } from '../kit'
import { startBotMatch } from '../matchSetup'
import { MapArt } from './Art'
import { ProfileChip, ScreenFrame } from './ScreenFrame'

const LEVEL_TEXT: Record<BotLevel, string> = {
  easy: 'Mua đất ngẫu nhiên, hiếm khi xây nhà.',
  normal: 'Ưu tiên gom trọn nhóm màu, luôn giữ tiền dự phòng.',
  hard: 'Tính tiền thuê, chặn bạn sắp thắng, mua lại có chiến thuật.',
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-[0.18rem] px-[1rem] py-[0.45rem] text-[1.15rem] font-extrabold transition ${
        active ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-md' : 'border-transparent bg-white text-stone-500 hover:-translate-y-[0.1rem]'
      }`}
    >
      {children}
    </button>
  )
}

export function BotSetupScreen() {
  const [bots, setBots] = useState(3)
  const [level, setLevel] = useState<BotLevel>('normal')
  const skin = useProfileStore((s) => s.skin)
  return (
    <ScreenFrame title="Chơi với bot" width="w-[36rem]">
      <div className="flex flex-col gap-[1rem]">
        <div className="flex items-center gap-[1rem]">
          <img src={skinById(skin).avatar} alt="" className="h-[5rem] w-[5rem] rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100" />
          <div className="text-[1.05rem] text-stone-500">
            Quân của bạn: <b className="text-ink">{skinById(skin).name}</b>
            <br />
            Đổi quân trong Cửa hàng.
          </div>
        </div>
        <div>
          <div className="mb-[0.4rem] text-[1.05rem] font-bold text-stone-500 uppercase">Số bot</div>
          <div className="flex gap-[0.6rem]">
            {[1, 2, 3].map((n) => (
              <Choice key={n} active={bots === n} onClick={() => setBots(n)}>
                {n} bot
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-[0.4rem] text-[1.05rem] font-bold text-stone-500 uppercase">Độ khó</div>
          <div className="flex gap-[0.6rem]">
            {BOT_LEVELS.map((l) => (
              <Choice key={l} active={level === l} onClick={() => setLevel(l)}>
                {BOT_LEVEL_NAMES[l]}
              </Choice>
            ))}
          </div>
          <p className="mt-[0.4rem] text-[1rem] text-stone-500">{LEVEL_TEXT[level]}</p>
        </div>
        <button
          className="btn-3d btn-green mx-auto mt-[0.4rem] px-[3rem] py-[0.6rem] text-[1.5rem]"
          onClick={() => {
            unlockAudio()
            startBotMatch(bots, level)
          }}
        >
          BẮT ĐẦU
        </button>
      </div>
    </ScreenFrame>
  )
}

export function MapsScreen() {
  const maps = [
    { name: 'Vòng quanh thế giới', note: '20 thành phố, 4 khu du lịch', ready: true },
    { name: 'Bản đồ mới', note: 'Coming soon', ready: false },
    { name: 'Bản đồ mới', note: 'Coming soon', ready: false },
  ]
  return (
    <ScreenFrame title="Chọn bản đồ" width="w-[42rem]">
      <div className="grid grid-cols-3 gap-[0.9rem]">
        {maps.map((m, i) => (
          <div key={i} className={`relative overflow-hidden rounded-xl bg-white p-[0.6rem] text-center shadow ${m.ready ? 'ring-[0.2rem] ring-sky-400' : 'opacity-70 grayscale-[0.6]'}`}>
            <div className="h-[6rem] rounded-lg bg-[#fff1cf] p-[0.3rem]">
              <MapArt />
            </div>
            <div className="mt-[0.4rem] text-[1.1rem] leading-tight font-extrabold text-ink">{m.name}</div>
            <div className={`text-[0.95rem] font-bold ${m.ready ? 'text-emerald-600' : 'text-rose-500 uppercase'}`}>{m.ready ? 'Đang dùng' : m.note}</div>
            {m.ready && <div className="text-[0.85rem] text-stone-400">{m.note}</div>}
          </div>
        ))}
      </div>
      <p className="mt-[0.9rem] text-center text-[1rem] text-stone-500">Bản đồ mới sẽ ra mắt trong các bản cập nhật tới.</p>
    </ScreenFrame>
  )
}

function SkinCard({ skin }: { skin: SkinDef }) {
  const { owned, skin: equipped, gold, buy, equip } = useProfileStore()
  const has = owned.includes(skin.id)
  const using = equipped === skin.id
  return (
    <div className={`flex flex-col items-center rounded-xl bg-white p-[0.5rem] shadow ${using ? 'ring-[0.2rem] ring-emerald-400' : ''}`}>
      <img src={skin.avatar} alt="" className="h-[5.2rem] w-[5.2rem] rounded-lg bg-gradient-to-b from-sky-100 to-white" />
      <div className="mt-[0.2rem] line-clamp-1 text-center text-[0.95rem] font-extrabold text-ink">{skin.name}</div>
      {using ? (
        <span className="mt-[0.3rem] text-[0.95rem] font-extrabold text-emerald-600">Đang dùng</span>
      ) : has ? (
        <button className="btn-3d btn-blue mt-[0.3rem] px-[1rem] py-[0.1rem] text-[0.95rem]" onClick={() => equip(skin.id)}>
          Dùng
        </button>
      ) : (
        <button
          className="btn-3d btn-yellow mt-[0.3rem] flex items-center gap-[0.3rem] px-[0.8rem] py-[0.1rem] text-[0.95rem]"
          disabled={gold < skin.price}
          onClick={() => {
            unlockAudio()
            if (buy(skin.id)) playSound('buy')
          }}
        >
          {formatMoney(skin.price)} <CoinIcon />
        </button>
      )}
    </div>
  )
}

export function ShopScreen() {
  const [tab, setTab] = useState<SkinDef['kind']>('character')
  const setScreen = useUiStore((s) => s.setScreen)
  return (
    <>
      <div className="absolute top-[1rem] left-[1rem] z-10">
        <ProfileChip />
      </div>
      <ScreenFrame title="Cửa hàng" width="w-[52rem]" onBack={() => setScreen('home')}>
        <div className="mb-[0.8rem] flex items-center justify-between gap-[1rem]">
          <div className="flex gap-[0.5rem]">
            <Choice active={tab === 'character'} onClick={() => setTab('character')}>
              Nhân vật
            </Choice>
            <Choice active={tab === 'pet'} onClick={() => setTab('pet')}>
              Thú cưng
            </Choice>
          </div>
          <p className="text-right text-[0.95rem] text-stone-500">
            Thắng nhận {META.goldWin} Vàng, thua nhận {META.goldLose}. Skin chỉ để trang trí.
          </p>
        </div>
        <div className="grid grid-cols-6 gap-[0.7rem] max-[700px]:grid-cols-4">
          {SKINS.filter((s) => s.kind === tab).map((skin) => (
            <SkinCard key={skin.id} skin={skin} />
          ))}
        </div>
      </ScreenFrame>
    </>
  )
}
