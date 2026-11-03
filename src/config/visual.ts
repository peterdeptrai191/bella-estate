/**
 * TẤT CẢ thông số hình ảnh của bàn cờ 3D.
 * Sửa trực tiếp ở đây, hoặc mở `npm run dev` rồi kéo thanh trượt ở bảng điều khiển góc phải
 * (chỉ có ở chế độ dev) và bấm "Copy cấu hình" để dán lại vào file này.
 *
 * Đơn vị: chiều dài tính theo "ô" (1 = bề ngang một ô thường), góc tính bằng độ, màu là mã hex.
 */
export const VISUAL = {
  /** Nền phía sau bàn cờ: gradient từ trên xuống dưới. */
  background: {
    top: '#bfe6f6',
    bottom: '#f3efe2',
  },

  camera: {
    /** Góc nhìn xuống so với mặt bàn (độ). 90 = nhìn thẳng từ trên xuống. */
    elevationDeg: 42,
    /** Góc xoay quanh bàn cờ (độ). 45 = nhìn chéo, ô Xuất Phát ở dưới cùng. */
    azimuthDeg: 45,
    /** Khoảng trống quanh bàn cờ khi tự co cho vừa khung (1 = sát mép). */
    fitPadding: 1.12,
  },

  board: {
    /** Bề ngang một ô thường (dọc theo cạnh). */
    tileWidth: 1,
    /** Kích thước ô góc, cũng là chiều sâu của mọi ô. */
    cornerSize: 1.7,
    /** Độ dày của ô. */
    tileHeight: 0.28,
    /** Khe hở giữa các ô. */
    tileGap: 0.06,
    /** Độ bo góc của ô. */
    tileRadius: 0.07,
    /** Độ mịn của phần bo (số đoạn). */
    tileSmoothness: 4,
    /** Phần đế bàn cờ thò ra ngoài các ô. */
    baseMargin: 0.3,
    /** Độ dày của đế bàn cờ. */
    baseThickness: 0.55,
    /** Độ bo của đế. */
    baseRadius: 0.18,
    /** Phần giữa (bãi cỏ) thụt vào so với mép trong của các ô. */
    centerInset: 0.18,
    /** Bãi cỏ thấp hơn mặt ô bao nhiêu. */
    centerDrop: 0.12,
    /** Tỷ lệ chiều sâu ô dành cho dải màu nhóm (phía trong bàn cờ). */
    stripRatio: 0.3,
    /** Độ dày dải màu nhóm nhô lên khỏi mặt ô. */
    stripHeight: 0.03,
  },

  colors: {
    base: '#f4efe6',
    baseSide: '#8d7f74',
    center: '#9ed97c',
    tile: '#fbf8f2',
    corner: '#fffaf0',
    chance: '#e8dcff',
    tax: '#ffe3d3',
    resort: '#d6f3f5',
    sand: '#f6e2b3',
    water: '#7fd3e6',
    start: '#ffe9a8',
    festival: '#ffd6e5',
    airport: '#dfe7f2',
    /** Sàn hứng bóng dưới bàn cờ. */
    shadowFloorOpacity: 0.22,
  },

  /** Đồ trang trí trên các ô đặc biệt. */
  props: {
    /** Phóng to/thu nhỏ toàn bộ đồ trang trí. */
    scale: 1.3,
    trunk: '#b98a5e',
    leaf: '#5cc28a',
    gold: '#ffc94d',
    paper: '#ffffff',
    umbrella: '#ff8fab',
    tower: '#f2f4f8',
    glass: '#8fd0ff',
    flag: '#ff6f91',
    pole: '#d9d4cc',
  },

  buildings: {
    /** Kích thước cạnh một căn nhà. */
    houseSize: 0.3,
    /** Chiều cao tường nhà so với cạnh. */
    houseWallRatio: 0.85,
    /** Chiều cao mái nhà so với cạnh. */
    roofRatio: 0.6,
    /** Chiều cao thân Landmark. */
    landmarkHeight: 1.05,
    /** Bề ngang thân Landmark. */
    landmarkWidth: 0.4,
    wall: '#ffffff',
    window: '#a9d8f5',
  },

  /** Màu mái nhà theo người chơi 1–4. */
  playerColors: ['#ff6f91', '#4da3ff', '#4cc983', '#ffb547'],

  material: {
    /** Độ nhám (0 = bóng, 1 = mờ). */
    roughness: 0.82,
    metalness: 0,
  },

  lights: {
    hemisphere: {
      sky: '#ffffff',
      ground: '#c9b8a8',
      intensity: 1.6,
    },
    sun: {
      color: '#fff4e5',
      intensity: 2.4,
      /** Hướng mặt trời quanh bàn cờ (độ). */
      azimuthDeg: 120,
      /** Độ cao mặt trời (độ). */
      elevationDeg: 52,
    },
    shadow: {
      /** Độ phân giải bản đồ bóng (512 / 1024 / 2048 / 4096). */
      mapSize: 2048,
      /** Độ mềm mép bóng. */
      radius: 6,
      bias: -0.0005,
      normalBias: 0.02,
    },
  },

  /** Ambient occlusion (bóng tối ở các góc khuất). */
  ao: {
    enabled: true,
    radius: 0.9,
    intensity: 2.2,
    distanceFalloff: 1,
    color: '#3d2e2a',
  },

  /** Nhà mẫu tạm hiển thị để xem thử (level: 1–3 nhà, 4 = Landmark; player: 1–4). */
  preview: {
    showBuildings: true,
    buildings: [
      { tile: 1, level: 1, player: 1 },
      { tile: 2, level: 2, player: 1 },
      { tile: 4, level: 3, player: 1 },
      { tile: 10, level: 4, player: 2 },
      { tile: 13, level: 2, player: 2 },
      { tile: 18, level: 3, player: 3 },
      { tile: 21, level: 4, player: 3 },
      { tile: 25, level: 1, player: 4 },
      { tile: 31, level: 4, player: 4 },
    ],
  },
}

export type VisualConfig = typeof VISUAL
