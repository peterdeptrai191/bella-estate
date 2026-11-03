import { Canvas } from '@react-three/fiber'
import { useVisual } from '../store/visualStore'
import { Board } from './Board'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { Lights } from './Lights'

/**
 * Scene 3D tĩnh: bàn cờ isometric.
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
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ alpha: true }}
      className="absolute inset-0"
      style={{ background: `linear-gradient(180deg, ${background.top} 0%, ${background.bottom} 100%)` }}
    >
      <CameraRig />
      <Lights />
      <Board />
      <Effects />
    </Canvas>
  )
}
