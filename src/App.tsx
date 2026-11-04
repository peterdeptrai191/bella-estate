import { lazy, Suspense, useEffect } from 'react'
import { GameScene } from './scene/GameScene'
import { reconnect } from './store/net'
import { useUiStore } from './store/uiStore'
import { Hud } from './ui/Hud'
import { RotateHint } from './ui/hud/Overlays'
import { HomeScreen } from './ui/screens/HomeScreen'
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
      {/* Bàn cờ 3D phía sau được làm mờ */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bfe6f6]/55 to-[#f3efe2]/45 backdrop-blur-[3px]" />
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

  // Tải lại trang giữa ván online: tự vào lại phòng (server giữ chỗ 60 giây).
  useEffect(() => {
    void reconnect()
  }, [])

  return (
    <div className="relative h-full w-full">
      <GameScene />
      {screen === 'game' ? <Hud /> : <Menus />}
      {VisualTuner && (
        <Suspense fallback={null}>
          <VisualTuner />
        </Suspense>
      )}
    </div>
  )
}
