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
    resort: '#d4f1e8',
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

  /** Quân cờ (Kenney Mini Characters / Cube Pets, CC0). */
  pieces: {
    /** Model và ảnh chân dung lấy theo skin của từng người chơi: config/skins.ts. */
    /** Chiều cao quân cờ (model được tự co về chiều cao này). */
    height: 0.62,
    /** Đế tròn màu người chơi dưới chân quân. */
    baseRadius: 0.16,
    baseHeight: 0.05,
    /** Khoảng lệch giữa các quân khi đứng chung một ô. */
    slotSpread: 0.2,
    /** Quân đứng lệch vào phía trong ô (tỷ lệ chiều sâu ô), để không che nhà. */
    anchorInset: 0.14,
    /** Như trên nhưng cho 4 ô góc, để không đứng lẫn vào đồ trang trí. */
    cornerInset: 0.27,
  },

  /** Chọn ô trên bàn cờ (Lễ Hội, Sân Bay, Động Đất, bán tài sản…). */
  pick: {
    /** Màu tô ô chọn được: lựa chọn có lợi / có hại, và ô đang được chọn. */
    good: '#ffd84d',
    bad: '#ff5c8a',
    selected: '#ff2d6f',
    /** Độ đậm nhấp nháy (thấp nhất → cao nhất) và tốc độ. */
    opacityMin: 0.3,
    opacityMax: 0.8,
    pulseSpeed: 4,
    /** Ô không chọn được thì tối đi. */
    dimOpacity: 0.32,
    /** Ô chọn được nhô lên một chút. */
    lift: 0.06,
  },

  /** Tên ô in trên mặt bàn cờ (chữ 3D phẳng). */
  tileText: {
    enabled: true,
    /** Font gộp Latin + tiếng Việt (Baloo 2, OFL) trong public/fonts. */
    font: 'fonts/baloo2-800.woff',
    fontSize: 0.15,
    cornerFontSize: 0.2,
    color: '#5b5466',
    /** Khoảng cách từ mép ngoài ô vào trong (tỷ lệ chiều sâu ô). */
    edgeInset: 0.16,
  },

  /** Nhãn tiền thuê trên các ô có chủ. */
  tags: {
    enabled: true,
    /** Độ cao nhãn so với mặt ô. */
    height: 0.08,
  },

  /** Xúc xắc ở giữa bàn cờ. */
  dice: {
    size: 0.5,
    /** Độ bo góc (tỷ lệ cạnh). */
    roundness: 0.18,
    color: '#e23a46',
    pipColor: '#fbfaf5',
    /** Bán kính chấm (tỷ lệ cạnh). */
    pipRatio: 0.1,
    /** Khoảng cách giữa hai viên. */
    spacing: 0.8,
  },

  /** Cây trang trí trên bãi cỏ (Kenney City Kit Suburban, CC0). Giữ khoảng giữa trống cho xúc xắc. */
  scenery: {
    enabled: true,
    scale: 1.8,
    items: [
      { model: 'tree-large', x: 2.75, z: 2.3, rotationDeg: 0 },
      { model: 'tree-small', x: 2.3, z: 2.8, rotationDeg: 40 },
      { model: 'tree-large', x: -2.75, z: -2.3, rotationDeg: 90 },
      { model: 'tree-small', x: -2.3, z: -2.8, rotationDeg: 10 },
      { model: 'tree-large', x: -2.75, z: 2.6, rotationDeg: 30 },
      { model: 'planter', x: -2.2, z: 2.85, rotationDeg: 0 },
      { model: 'tree-small', x: 2.8, z: -2.7, rotationDeg: 60 },
      { model: 'planter', x: 2.25, z: -2.85, rotationDeg: 90 },
    ],
  },

  /** Thời lượng (giây) và biên độ các animation. */
  animation: {
    /** Nghỉ giữa hai event. */
    eventGap: 0.05,
    diceRise: 0.35,
    diceFall: 0.4,
    diceBounce: 0.28,
    /** Độ cao xúc xắc bay lên. */
    diceHeight: 2.2,
    /** Số vòng xoay tối thiểu khi tung. */
    diceSpins: 2,
    /** Thời gian nhảy một ô. */
    hopDuration: 0.3,
    hopHeight: 0.42,
    /** Mức co giãn khi nhảy (0 = không co giãn). */
    squash: 0.18,
    /** Bay từ Sân Bay. */
    flyDuration: 1.2,
    flyHeight: 3,
    /** Dịch chuyển tức thời (thẻ, ra đảo): thu nhỏ rồi hiện lại. */
    teleportDuration: 0.5,
    /** Các quân xếp lại chỗ khi có quân rời/tới ô. */
    restackDuration: 0.25,
    /** Nhà/Landmark mọc lên. */
    buildDuration: 0.5,
    buildOvershoot: 1.15,
    dustCount: 12,
    dustDuration: 0.7,
    dustColor: '#efe4d2',
    /** Tiền bay. */
    coinCount: 6,
    coinDuration: 0.6,
    coinStagger: 0.08,
    coinHeight: 1.4,
    coinSize: 0.2,
    coinColor: '#ffc94d',
    /** Camera bám quân đang đi: mức zoom thêm và tốc độ bám. */
    cameraFollowZoom: 1.2,
    cameraFollowSpeed: 4,
    /** Dừng lại khi rút thẻ / đầu lượt. */
    cardPause: 0.6,
    turnPause: 0.25,
    /** Bot "suy nghĩ" trước mỗi quyết định. */
    botThinkDelay: 0.55,
    /** Bước tự làm cho người chơi (đi quân, trả thuê, kết thúc lượt). */
    autoActionDelay: 0.3,
    /** Thẻ Cơ Hội: thời gian lật, thời gian tự đóng khi bot rút / khi người chơi không bấm. */
    cardFlipDuration: 0.7,
    cardRevealBot: 2,
    cardRevealHuman: 8,
    /** Chữ lớn giữa màn hình (ĐÔI!, Ra Đảo…). */
    bannerDuration: 1.3,
    /** Số tiền trên khung người chơi chạy tới giá trị mới. */
    moneyCountDuration: 0.6,
  },

  /** Nhà mẫu tạm hiển thị khi CHƯA có ván chơi (level: 1–3 nhà, 4 = Landmark; player: 1–4). */
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
