import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useUiStore } from '../store/uiStore'
import { useVisual } from '../store/visualStore'
import { Board } from './Board'
import { CameraRig } from './CameraRig'
import { Dice } from './Dice'
import { Effects } from './Effects'
import { EventPlayer } from './events/EventPlayer'
import { FxLayer } from './Fx'
import { Lights } from './Lights'
import { Pieces } from './Pieces'
import { Scenery } from './Scenery'
import { TileLabels } from './TileLabels'
import { TileTags } from './TileTags'

/**
 * Scene 3D: bàn cờ isometric, quân cờ, xúc xắc và event player phát animation.
 * - `shadows="percentage"` = PCFShadowMap. Từ three r180, PCFSoftShadowMap đã bị bỏ và tự chuyển về
 *   PCFShadowMap; độ mềm của bóng chỉnh bằng `lights.shadow.radius` trong config/visual.ts.
 * - `flat`: không tone mapping, để màu pastel hiện đúng mã hex trong config (có/không AO đều giống nhau).
 */
export function GameScene() {
  const { background } = useVisual()
  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={[1, 2]}
      gl={{ alpha: true }}
      onPointerMissed={() => useUiStore.getState().selectTile(null)}
      className="absolute inset-0"
      style={{ background: `linear-gradient(180deg, ${background.top} 0%, ${background.bottom} 100%)` }}
    >
      <CameraRig />
      <Lights />
      <Board />
      <Dice />
      <Pieces />
      <TileTags />
      <Suspense fallback={null}>
        <Scenery />
      </Suspense>
      <Suspense fallback={null}>
        <TileLabels />
      </Suspense>
      <FxLayer />
      <EventPlayer />
      <Effects />
    </Canvas>
  )
}
