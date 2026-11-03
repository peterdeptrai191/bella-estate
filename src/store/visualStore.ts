import { create } from 'zustand'
import { VISUAL, type VisualConfig } from '../config/visual'

/**
 * Thông số hình ảnh đang dùng. Mặc định lấy từ config/visual.ts;
 * ở chế độ dev, bảng leva ghi đè vào đây để chỉnh trực tiếp.
 */
interface VisualStore {
  visual: VisualConfig
  setVisual: (visual: VisualConfig) => void
}

export const useVisualStore = create<VisualStore>((set) => ({
  visual: VISUAL,
  setVisual: (visual) => set({ visual }),
}))

export const useVisual = () => useVisualStore((s) => s.visual)
