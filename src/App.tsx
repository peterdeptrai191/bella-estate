import { lazy, Suspense, useEffect, useState } from 'react'
import { GameScene } from './scene/GameScene'
import { reconnect } from './store/net'
import { useUiStore } from './store/uiStore'
import { Hud } from './ui/Hud'
import { RotateHint } from './ui/hud/Overlays'
import { HomeScreen, StudioSplash } from './ui/screens/HomeScreen'
import { LandingBg } from './ui/screens/LandingBg'
import { FriendsScreen, LobbyScreen } from './ui/screens/OnlineScreens'
import { BotSetupScreen, MapsScreen, ShopScreen } from './ui/screens/SetupScreens'

// Bảng chỉnh thông số hình ảnh: chỉ nạp ở chế độ dev, không có trong bản build.
const VisualTuner = import.meta.env.DEV
  ? lazy(() => import('./ui/dev/VisualTuner').then((m) => ({ default: m.VisualTuner })))
  : null

function Menus() {
  const screen = useUiStore((s) => s.screen)
  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      <LandingBg />
      {screen === 'home' && <HomeScreen />}
      {screen === 'bots' && <BotSetupScreen />}
      {screen === 'friends' && <FriendsScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'shop' && <ShopScreen />}
      {screen === 'maps' && <MapsScreen />}
      <RotateHint />
    </div>
  )
}

export default function App() {
  const screen = useUiStore((s) => s.screen)
  const [splash, setSplash] = useState(true)

  // Màn hình nhà phát hành khi mở game.
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  // Tải lại trang giữa ván online: tự vào lại phòng (server giữ chỗ 60 giây).
  useEffect(() => {
    void reconnect()
  }, [])

  return (
    <div className="relative h-full w-full">
      {/* Bàn cờ 3D chỉ dựng khi vào trận; menu dùng nền xanh, đỡ tốn pin. */}
      {screen === 'game' ? (
        <>
          <GameScene />
          <Hud />
        </>
      ) : (
        <Menus />
      )}
      {splash && <StudioSplash onDone={() => setSplash(false)} />}
      {VisualTuner && (
        <Suspense fallback={null}>
          <VisualTuner />
        </Suspense>
      )}
    </div>
  )
}
