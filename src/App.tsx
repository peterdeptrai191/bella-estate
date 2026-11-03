import { GameScene } from './scene/GameScene'
import { Hud } from './ui/Hud'

export default function App() {
  return (
    <div className="relative h-full w-full">
      <GameScene />
      <Hud />
    </div>
  )
}
