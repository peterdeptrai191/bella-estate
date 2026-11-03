import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAnimationStore } from './store/animationStore'
import { useGameStore } from './store/gameStore'
import { useVisualStore } from './store/visualStore'

// Chế độ dev: mở store ra console để gỡ lỗi / đẩy event mẫu vào hàng đợi animation.
if (import.meta.env.DEV) {
  Object.assign(window, { __bella: { game: useGameStore, animation: useAnimationStore, visual: useVisualStore } })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
