/**
 * Phát hiệu ứng âm thanh bằng Web Audio. Tải file khi cần, bỏ qua lặng lẽ nếu trình duyệt chặn.
 * Trình duyệt chỉ cho phát sau thao tác đầu tiên của người dùng (click/chạm).
 */
import { AUDIO, type SoundName } from '../config/audio'

let context: AudioContext | null = null
let muted = false
const buffers = new Map<string, Promise<AudioBuffer | null>>()

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  context ??= new AudioContext()
  return context
}

function load(file: string): Promise<AudioBuffer | null> {
  let pending = buffers.get(file)
  if (!pending) {
    const ctx = getContext()
    pending = ctx
      ? fetch(`sounds/${file}.mp3`)
          .then((r) => r.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data))
          .catch(() => null)
      : Promise.resolve(null)
    buffers.set(file, pending)
  }
  return pending
}

/** Gọi trong một thao tác của người dùng để mở khóa âm thanh và tải trước. */
export function unlockAudio(): void {
  const ctx = getContext()
  void ctx?.resume()
  for (const { file } of Object.values(AUDIO.sounds)) for (const f of filesOf(file)) void load(f)
}

export function setMuted(value: boolean): void {
  muted = value
}

export function isMuted(): boolean {
  return muted
}

function filesOf(file: string | readonly string[]): readonly string[] {
  return typeof file === 'string' ? [file] : file
}

/**
 * Phát một âm. Âm có nhiều file thì chọn ngẫu nhiên một file; `jitter` lệch cao độ rất nhẹ
 * (AUDIO.pitchJitter) để âm lặp đỡ đơn điệu mà không bị chói.
 */
export function playSound(name: SoundName, options: { volume?: number; jitter?: boolean } = {}): void {
  if (muted) return
  const ctx = getContext()
  if (!ctx || ctx.state !== 'running') return
  const sound = AUDIO.sounds[name]
  const files = filesOf(sound.file)
  const file = files[Math.floor(Math.random() * files.length)]
  void load(file).then((buffer) => {
    if (!buffer) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = options.jitter ? 1 + (Math.random() * 2 - 1) * AUDIO.pitchJitter : 1
    const gain = ctx.createGain()
    gain.gain.value = AUDIO.masterVolume * sound.volume * (options.volume ?? 1)
    source.connect(gain).connect(ctx.destination)
    source.start()
  })
}
