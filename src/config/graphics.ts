/**
 * Thông số đồ họa. Chỉ là số và chuỗi — không import Three.js ở đây
 * để thư mục config luôn là dữ liệu thuần.
 */
export const GRAPHICS = {
  background: '#f6efe4',
  ground: {
    size: 22,
    color: '#f1e3cf',
  },
  camera: {
    /** Vị trí camera isometric cố định (nhìn chéo ~45°). */
    position: [16, 16, 16] as [number, number, number],
    zoom: 40,
    near: 0.1,
    far: 200,
  },
  light: {
    ambientIntensity: 0.6,
    sunIntensity: 1.6,
    sunPosition: [10, 18, 6] as [number, number, number],
    shadowMapSize: 2048,
  },
} as const
