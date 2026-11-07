/**
 * Bộ ký tự tạo sẵn cho atlas chữ 3D (troika). Mọi Text dùng cùng font + sdfGlyphSize chia chung một atlas;
 * tạo đủ ký tự ngay từ đầu để atlas không phải nới rộng giữa chừng (máy yếu có thể mất chữ khi nới).
 */
import { BOARD } from '../config/board'
import { VISUAL } from '../config/visual'

const extra = [VISUAL.decor.signText, '0123456789.,K x']

export const TEXT_CHARACTERS = [...new Set([...BOARD.map((t) => t.name + t.name.toUpperCase()), ...extra].join(''))].join('')
