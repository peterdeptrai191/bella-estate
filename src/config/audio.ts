/**
 * Âm thanh (Kenney Interface Sounds, CC0). File nằm ở public/sounds/<file>.mp3.
 * Đổi file hoặc âm lượng từng âm ở đây.
 */
export const AUDIO = {
  masterVolume: 0.6,
  sounds: {
    turnStart: { file: 'select_003', volume: 0.5 },
    diceShake: { file: 'scratch_004', volume: 0.8 },
    diceLand: { file: 'drop_002', volume: 0.9 },
    hop: { file: 'pluck_001', volume: 0.6 },
    fly: { file: 'maximize_008', volume: 0.7 },
    passStart: { file: 'confirmation_003', volume: 0.7 },
    buy: { file: 'confirmation_001', volume: 0.8 },
    build: { file: 'maximize_004', volume: 0.8 },
    coin: { file: 'glass_002', volume: 0.5 },
    card: { file: 'open_002', volume: 0.8 },
    festival: { file: 'maximize_006', volume: 0.8 },
    island: { file: 'error_005', volume: 0.7 },
    earthquake: { file: 'drop_004', volume: 0.9 },
    sold: { file: 'minimize_004', volume: 0.7 },
    bankrupt: { file: 'error_006', volume: 0.8 },
    gameOver: { file: 'confirmation_004', volume: 0.9 },
    click: { file: 'click_001', volume: 0.6 },
  },
}

export type SoundName = keyof typeof AUDIO.sounds
