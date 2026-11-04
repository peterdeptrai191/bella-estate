/**
 * Trang chủ kiểu landing page (theo bố cục video tham khảo: nền xanh, chữ trắng đậm, nút vàng có mũi tên,
 * thẻ tính năng, khối giới thiệu có ảnh, chân trang). Logo game Bella Estate, nhà phát hành Bella Game Studio.
 */
import { useRef, type ReactNode } from 'react'
import { unlockAudio } from '../../audio/soundPlayer'
import { BOARD } from '../../config/board'
import { BOT_LEVELS, BOT_LEVEL_NAMES } from '../../config/bots'
import { SKINS, skinById } from '../../config/skins'
import { formatMoney } from '../../game-core'
import { useProfileStore } from '../../store/profileStore'
import { useUiStore, type Screen } from '../../store/uiStore'
import { CoinIcon } from '../kit'
import { GlobeArt, MapArt, RobotArt, ShopArt } from './Art'
import { ProfileChip, SoundButton } from './ScreenFrame'
import { FullscreenButton } from '../FullscreenButton'

const ESTATE_LOGO = 'brand/bella-estate-logo.webp'
const STUDIO_LOGO = 'brand/bella-game-studio.webp'

/** Nút vàng kiểu tham khảo: chữ + ô mũi tên bên phải. */
function ArrowButton({
  children,
  onClick,
  variant = 'yellow',
  size = 'md',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'yellow' | 'white'
  size?: 'md' | 'lg'
  disabled?: boolean
}) {
  const colors =
    variant === 'yellow'
      ? 'bg-[#ffc93c] text-[#c2410c] shadow-[0_0.3rem_0_#d99a1a,0_0.6rem_1.2rem_rgb(10_20_80/0.35)]'
      : 'bg-[#eef2ff] text-[#2f55d4] shadow-[0_0.3rem_0_#b9c6f5,0_0.6rem_1.2rem_rgb(10_20_80/0.3)]'
  const arrow = variant === 'yellow' ? 'bg-[#ffb21f]' : 'bg-[#d9e1fb]'
  const pad = size === 'lg' ? 'text-[1.35rem] [&>span:first-child]:px-[1.6rem] [&>span]:py-[0.6rem]' : 'text-[1.05rem] [&>span:first-child]:px-[1.2rem] [&>span]:py-[0.4rem]'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-stretch overflow-hidden rounded-xl font-extrabold transition hover:-translate-y-[0.1rem] active:translate-y-[0.2rem] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${colors} ${pad}`}
    >
      <span>{children}</span>
      <span className={`flex items-center px-[0.8rem] transition group-hover:px-[1rem] ${arrow}`}>›</span>
    </button>
  )
}

function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-[1.6rem] text-center">
      <h2 className="text-[2.8rem] leading-tight font-extrabold text-white [text-wrap:balance]">{children}</h2>
      {sub && <p className="mt-[0.3rem] text-[1.15rem] text-white/70">{sub}</p>}
    </div>
  )
}

function ModeCard({
  title,
  text,
  art,
  action,
  onClick,
  soon,
}: {
  title: string
  text: string
  art: ReactNode
  action: string
  onClick: () => void
  soon?: boolean
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[1.3rem] bg-[#2747b8]/70 p-[0.9rem] shadow-[0_0.8rem_1.6rem_rgb(10_20_80/0.25)]">
      <div className="h-[8.5rem] rounded-xl bg-[#4a72ee] p-[0.6rem] shadow-inner">{art}</div>
      <h3 className="mt-[0.8rem] text-center text-[1.45rem] leading-tight font-extrabold text-white">{title}</h3>
      <p className="mt-[0.3rem] mb-[0.8rem] flex-1 text-center text-[1rem] leading-snug text-white/75">{text}</p>
      <button
        onClick={onClick}
        className="group flex items-stretch overflow-hidden rounded-lg bg-[#eef2ff] text-[1rem] font-extrabold text-[#2f55d4] transition hover:bg-white"
      >
        <span className="flex-1 py-[0.45rem]">{action}</span>
        <span className="flex items-center bg-[#d9e1fb] px-[0.8rem]">›</span>
      </button>
      {soon && (
        <span className="absolute top-[1.4rem] -right-[2.6rem] w-[10rem] rotate-[35deg] bg-[#ffc93c] py-[0.15rem] text-center text-[0.8rem] font-extrabold tracking-wider text-[#c2410c] uppercase shadow">
          Coming soon
        </span>
      )}
    </div>
  )
}

export function HomeScreen() {
  const setScreen = useUiStore((s) => s.setScreen)
  const { skin: equipped, owned } = useProfileStore()
  const scroller = useRef<HTMLDivElement>(null)
  const go = (screen: Screen) => () => {
    unlockAudio()
    setScreen(screen)
  }
  const scrollTo = (id: string) => () => {
    const target = scroller.current?.querySelector(`#${id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const friend = SKINS.find((s) => s.id !== equipped && s.price === 0) ?? SKINS[1]
  const featured = SKINS.filter((s) => s.kind === 'pet' || s.price >= 250).slice(0, 6)
  const cities = BOARD.filter((t) => t.kind === 'CITY').length
  const resorts = BOARD.filter((t) => t.kind === 'RESORT').length

  return (
    <div ref={scroller} className="absolute inset-0 overflow-x-hidden overflow-y-auto scroll-smooth text-white">
      {/* Thanh trên cùng */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-[1rem] bg-[#2f55d4]/85 px-[2rem] py-[0.6rem] backdrop-blur">
        <button onClick={scrollTo('top')} className="flex items-center gap-[0.6rem]" aria-label="Bella Estate">
          <img src={ESTATE_LOGO} alt="Bella Estate" className="h-[3.9rem] w-auto drop-shadow" />
        </button>
        <nav className="flex items-center gap-[0.2rem] rounded-full bg-white/10 px-[0.5rem] py-[0.3rem] text-[1.02rem] font-bold max-[700px]:hidden">
          {[
            ['modes', 'Chế độ chơi'],
            ['skins', 'Quân cờ'],
            ['map', 'Bản đồ'],
          ].map(([id, label]) => (
            <button key={id} onClick={scrollTo(id)} className="rounded-full px-[0.9rem] py-[0.2rem] text-white/90 hover:bg-white/15">
              • {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-[0.6rem]">
          <ProfileChip />
          <SoundButton />
          <FullscreenButton size="h-[2.8rem] w-[2.8rem]" />
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative mx-auto grid max-w-[78rem] grid-cols-[1.05fr_1fr] items-center gap-[2rem] px-[2.5rem] pt-[1.5rem] pb-[2.5rem]">
        <div className="relative z-10">
          {/* Banner chào mừng */}
          <div className="relative mb-[1.1rem] inline-flex">
            <span className="absolute top-[0.4rem] -left-[0.9rem] h-full w-[1.4rem] bg-[#d99a1a]" style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,40% 50%)' }} />
            <span className="relative rounded-md bg-[#ffc93c] px-[1.2rem] py-[0.3rem] text-[1.25rem] font-extrabold text-[#9a3412] shadow-lg">
              Chào mừng đến với Bella Estate!
            </span>
          </div>
          <h1 className="text-[4.2rem] leading-[1.02] font-extrabold [text-wrap:balance]">Mua đất, xây nhà, chinh phục thế giới</h1>
          <p className="mt-[0.9rem] max-w-[32rem] text-[1.25rem] leading-snug text-white/80">
            Cờ tỷ phú 3D ván ngắn 15–25 phút. Mua lại đất của đối thủ, gom nhóm màu, độc quyền một cạnh bàn cờ để thắng sớm.
          </p>
          <div className="mt-[1.5rem] flex flex-wrap gap-[0.9rem]">
            <ArrowButton size="lg" onClick={go('friends')}>
              Chơi cùng bạn
            </ArrowButton>
            <ArrowButton size="lg" variant="white" onClick={go('bots')}>
              Chơi với bot
            </ArrowButton>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_201_60/0.35),transparent_65%)]" />
          <img src={ESTATE_LOGO} alt="Bella Estate" className="animate-bounce-soft relative w-[26rem] max-w-full drop-shadow-[0_1.4rem_1.6rem_rgb(10_20_80/0.45)]" />
          <img src={skinById(equipped).avatar} alt="" className="absolute bottom-[0.5rem] left-[2%] h-[5.5rem] w-[5.5rem] -rotate-6 rounded-2xl border-[0.25rem] border-white bg-sky-100 shadow-xl" />
          <span className="absolute top-[12%] right-[4%] flex items-center gap-[0.3rem] rounded-full bg-white px-[0.8rem] py-[0.2rem] text-[1.1rem] font-extrabold text-amber-600 shadow-xl">
            +200 <CoinIcon />
          </span>
        </div>
      </section>

      {/* Chế độ chơi */}
      <section id="modes" className="relative mx-auto max-w-[78rem] scroll-mt-[5rem] px-[2.5rem] py-[2.5rem]">
        <SectionTitle sub="Chọn cách bạn muốn chơi">Chơi thế nào?</SectionTitle>
        <div className="grid grid-cols-4 gap-[1.1rem] max-[760px]:grid-cols-2">
          <ModeCard
            title="Chơi cùng bạn"
            text="Tạo phòng 2–4 người, vào bằng mã, hoặc ghép trận nhanh."
            art={<GlobeArt avatars={[skinById(equipped).avatar, friend.avatar]} />}
            action="Tạo phòng"
            onClick={go('friends')}
          />
          <ModeCard
            title="Chơi với bot"
            text={`Luyện tay với 1–3 bot, độ khó ${BOT_LEVELS.map((l) => BOT_LEVEL_NAMES[l]).join(' / ')}.`}
            art={<RobotArt />}
            action="Thiết lập"
            onClick={go('bots')}
          />
          <ModeCard title="Cửa hàng" text="Đổi quân cờ: 12 nhân vật và 4 thú cưng, mua bằng Vàng." art={<ShopArt />} action="Xem skin" onClick={go('shop')} />
          <ModeCard title="Chọn bản đồ" text="Thêm nhiều bản đồ mới trong các bản cập nhật tới." art={<MapArt />} action="Xem bản đồ" onClick={go('maps')} soon />
        </div>
      </section>

      {/* Quân cờ nổi bật */}
      <section id="skins" className="relative mx-auto max-w-[78rem] scroll-mt-[5rem] px-[2.5rem] py-[2.5rem]">
        <SectionTitle sub="Skin chỉ để trang trí, không ảnh hưởng thắng thua">Quân cờ nổi bật</SectionTitle>
        <div className="rounded-[1.3rem] bg-[#2747b8]/60 p-[0.8rem]">
          <div className="grid grid-cols-[3rem_1fr_8rem_9rem] px-[1rem] pb-[0.4rem] text-[0.85rem] font-bold tracking-wider text-white/60 uppercase max-[640px]:hidden">
            <span>#</span>
            <span>Quân cờ</span>
            <span>Loại</span>
            <span className="text-right">Giá</span>
          </div>
          {featured.map((skin, i) => {
            const mine = owned.includes(skin.id)
            const highlight = i === 0
            return (
              <button
                key={skin.id}
                onClick={go('shop')}
                className={`grid w-full grid-cols-[3rem_1fr_8rem_9rem] items-center rounded-xl px-[1rem] py-[0.35rem] text-left text-[1.05rem] font-bold transition max-[640px]:grid-cols-[2rem_1fr_7rem] ${
                  highlight ? 'scale-[1.02] bg-white text-ink shadow-xl' : 'text-white hover:bg-white/10'
                }`}
              >
                <span className={highlight ? 'text-[#2f55d4]' : 'text-white/70'}>{i + 1}</span>
                <span className="flex items-center gap-[0.7rem]">
                  <img src={skin.avatar} alt="" className="h-[2.6rem] w-[2.6rem] rounded-full bg-sky-100" />
                  {skin.name}
                </span>
                <span className={`max-[640px]:hidden ${highlight ? 'text-stone-500' : 'text-white/70'}`}>{skin.kind === 'pet' ? 'Thú cưng' : 'Nhân vật'}</span>
                <span className="flex items-center justify-end gap-[0.3rem] tabular-nums">
                  {mine ? (
                    <span className={highlight ? 'text-emerald-600' : 'text-emerald-300'}>Đã có</span>
                  ) : (
                    <>
                      {formatMoney(skin.price)} <CoinIcon />
                    </>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-[1.2rem] flex justify-center">
          <ArrowButton onClick={go('shop')}>Vào cửa hàng</ArrowButton>
        </div>
      </section>

      {/* Bản đồ */}
      <section id="map" className="relative mx-auto max-w-[78rem] scroll-mt-[5rem] px-[2.5rem] py-[2.5rem]">
        <div className="grid grid-cols-[1fr_1.1fr] items-center gap-[2rem] rounded-[1.6rem] bg-[#2747b8]/60 p-[1.4rem] max-[760px]:grid-cols-1">
          <img src="images/board-world.webp" alt="Bàn cờ Vòng quanh thế giới" className="w-full rounded-[1.2rem] shadow-xl" />
          <div>
            <span className="text-[1rem] font-bold tracking-wider text-[#ffc93c] uppercase">Bản đồ đầu tiên</span>
            <h2 className="mt-[0.2rem] text-[2.6rem] leading-tight font-extrabold [text-wrap:balance]">Vòng quanh thế giới</h2>
            <p className="mt-[0.6rem] text-[1.1rem] leading-snug text-white/80">
              Từ Cairo, Hà Nội tới Paris, New York. Mỗi nhóm màu là một khu vực, giá đất tăng dần theo chiều đi. Gom trọn một khu để thu tiền thuê gấp đôi.
            </p>
            <div className="mt-[1rem] flex gap-[1.6rem]">
              {[
                [String(BOARD.length), 'ô'],
                [String(cities), 'thành phố'],
                [String(resorts), 'khu du lịch'],
              ].map(([n, label]) => (
                <div key={label}>
                  <div className="text-[2rem] leading-none font-extrabold">{n}</div>
                  <div className="text-[0.95rem] text-white/70">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-[1.3rem] flex flex-wrap gap-[0.8rem]">
              <ArrowButton onClick={go('bots')}>Chơi ngay</ArrowButton>
              <ArrowButton variant="white" onClick={go('maps')}>
                Bản đồ khác
              </ArrowButton>
            </div>
          </div>
        </div>
      </section>

      {/* Chân trang: nhà phát hành */}
      <footer className="mt-[1.5rem] bg-[#2747b8]">
        <div className="mx-auto flex max-w-[78rem] flex-wrap items-center justify-between gap-[1.2rem] px-[2.5rem] py-[1.4rem]">
          <div className="flex items-center gap-[1rem]">
            <img src={STUDIO_LOGO} alt="Bella Game Studio" className="h-[4.6rem] w-auto" />
            <div className="leading-tight">
              <div className="text-[0.9rem] text-white/60">Phát hành bởi</div>
              <div className="text-[1.3rem] font-extrabold">Bella Game Studio</div>
            </div>
          </div>
          <nav className="flex gap-[1.2rem] text-[1rem] font-bold text-white/80">
            <button onClick={go('friends')}>• Chơi cùng bạn</button>
            <button onClick={go('bots')}>• Chơi với bot</button>
            <button onClick={go('shop')}>• Cửa hàng</button>
          </nav>
          <div className="text-[0.9rem] text-white/60">© 2026 Bella Game Studio. Bella Estate là trò chơi của Bella Game Studio.</div>
        </div>
      </footer>
    </div>
  )
}

/** Màn hình nhà phát hành khi mở game (bấm để bỏ qua). */
export function StudioSplash({ onDone }: { onDone: () => void }) {
  return (
    <button onClick={onDone} className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-[1rem] bg-[#141a3a]" aria-label="Bỏ qua">
      <img src={STUDIO_LOGO} alt="Bella Game Studio" className="animate-pop-in w-[18rem] max-w-[60vw]" />
      <span className="text-[1.1rem] font-bold tracking-[0.3em] text-white/60 uppercase">giới thiệu</span>
    </button>
  )
}
