import { lazy, Suspense } from 'react'
import { GameScene } from './scene/GameScene'
import { Hud } from './ui/Hud'

// Bảng chỉnh thông số hình ảnh: chỉ nạp ở chế độ dev, không có trong bản build.
const VisualTuner = import.meta.env.DEV
  ? lazy(() => import('./ui/dev/VisualTuner').then((m) => ({ default: m.VisualTuner })))
  : null

export default function App() {
  return (
    <div className="relative h-full w-full">
      <GameScene />
      <Hud />
      {VisualTuner && (
        <Suspense fallback={null}>
          <VisualTuner />
        </Suspense>
      )}
    </div>
  )
}
