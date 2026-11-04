/**
 * Âm thanh (Kenney Casino Audio, Impact Sounds, Interface Sounds — CC0). File nằm ở public/sounds/<file>.mp3.
 * `file` là một tên hoặc danh sách tên (mỗi lần phát chọn ngẫu nhiên một file, để âm lặp lại đỡ đơn điệu).
 * Đổi file hoặc âm lượng từng âm ở đây. Các file đã được chỉnh về độ lớn gần nhau và cắt bớt dải cao chói tai.
 */
export const AUDIO = {
  masterVolume: 0.7,
  /** Âm lặp (bước nhảy, xúc xắc) lệch cao độ ngẫu nhiên trong khoảng ± này — nhỏ để không bị "chít chít". */
  pitchJitter: 0.04,
  sounds: {
    turnStart: { file: 'turn-start', volume: 0.35 },
    diceShake: { file: 'dice-shake', volume: 0.9 },
    diceLand: { file: ['dice-land-1', 'dice-land-2'], volume: 1 },
    diceBounce: { file: 'die-bounce', volume: 0.5 },
    hop: { file: ['hop-1', 'hop-2', 'hop-3'], volume: 0.45 },
    fly: { file: 'maximize_008', volume: 0.35 },
    passStart: { file: 'coins-fly', volume: 0.9 },
    buy: { file: 'chips-buy', volume: 1 },
    build: { file: ['build-1', 'build-2'], volume: 0.8 },
    /** Tiền bắt đầu bay (một tràng chip), và tiền tới nơi. */
    coin: { file: 'coins-fly', volume: 0.8 },
    coinLand: { file: 'coins-land', volume: 0.8 },
    card: { file: 'card-draw', volume: 0.6 },
    cardFlip: { file: 'card-place', volume: 0.9 },
    festival: { file: 'maximize_006', volume: 0.4 },
    island: { file: 'error_005', volume: 0.45 },
    earthquake: { file: 'earthquake', volume: 0.8 },
    sold: { file: 'sold', volume: 0.9 },
    bankrupt: { file: 'error_006', volume: 0.5 },
    gameOver: { file: 'confirmation_004', volume: 0.5 },
    click: { file: 'click_001', volume: 0.35 },
  },
}

export type SoundName = keyof typeof AUDIO.sounds
