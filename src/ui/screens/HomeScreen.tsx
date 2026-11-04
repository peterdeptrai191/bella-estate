import { SKINS } from '../../config/skins'
import { useProfileStore } from '../../store/profileStore'
import { useUiStore } from '../../store/uiStore'
import { skinById } from '../../config/skins'
import { unlockAudio } from '../../audio/soundPlayer'
import { GlobeArt, Logo, MapArt, RobotArt, ShopArt } from './Art'
import { MenuCard, ProfileChip, SoundButton } from './ScreenFrame'

/** Trang chủ: logo, lời chào, 4 lựa chọn lớn (theo bố cục video tham khảo, hình vẽ riêng). */
export function HomeScreen() {
  const setScreen = useUiStore((s) => s.setScreen)
  const skin = useProfileStore((s) => s.skin)
  const go = (screen: Parameters<typeof setScreen>[0]) => () => {
    unlockAudio()
    setScreen(screen)
  }
  const friend = SKINS.find((s) => s.id !== skin && s.price === 0) ?? SKINS[1]

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.2rem] p-[1rem]">
      <div className="absolute top-[1rem] left-[1rem]">
        <ProfileChip />
      </div>
      <div className="absolute top-[1rem] right-[1rem]">
        <SoundButton />
      </div>

      <Logo className="animate-pop-in" />

      <div className="relative">
        <span className="absolute top-[0.5rem] -left-[1.4rem] h-full w-[2rem] rounded-l-md bg-[#c42e5e]" style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,35% 50%)' }} />
        <span className="absolute top-[0.5rem] -right-[1.4rem] h-full w-[2rem] rounded-r-md bg-[#c42e5e]" style={{ clipPath: 'polygon(0 0,100% 0,65% 50%,100% 100%,0 100%)' }} />
        <div
          className="relative rounded-xl bg-[#f2437a] px-[2rem] py-[0.4rem] text-[1.4rem] font-extrabold text-white shadow-lg"
          style={{ textShadow: '0 0.08em 0 rgb(0 0 0 / 0.25)' }}
        >
          Chào mừng đến với Bella Estate!
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-[1.2rem]">
        <MenuCard title="Chơi cùng bạn" accent="#d8eefb" art={<GlobeArt avatars={[skinById(skin).avatar, friend.avatar]} />} onClick={go('friends')} />
        <MenuCard title="Chơi với bot" accent="#e3f4dc" art={<RobotArt />} onClick={go('bots')} />
        <MenuCard title="Cửa hàng" accent="#ffe4ec" art={<ShopArt />} onClick={go('shop')} />
        <MenuCard title="Chọn bản đồ" accent="#fff1cf" art={<MapArt />} onClick={go('maps')} badge="Coming soon" disabled />
      </div>
    </div>
  )
}
