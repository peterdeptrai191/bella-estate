import gsap from 'gsap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAnimationStore } from './store/animationStore'
import { useGameStore } from './store/gameStore'
import { useProfileStore } from './store/profileStore'
import { useUiStore } from './store/uiStore'
import { useVisualStore } from './store/visualStore'
import { exitToMenu, startBotMatch } from './ui/matchSetup'

// Chế độ dev: mở store ra console để gỡ lỗi / đẩy event mẫu vào hàng đợi animation.
// (`gsap` để máy chậm/headless tắt lagSmoothing: `__bella.gsap.ticker.lagSmoothing(0)`.)
if (import.meta.env.DEV) {
  Object.assign(window, {
    __bella: { game: useGameStore, animation: useAnimationStore, visual: useVisualStore, ui: useUiStore, profile: useProfileStore, gsap, newMatch: (seed?: number) => startBotMatch(3, 'normal', seed), menu: exitToMenu },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
