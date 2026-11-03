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
      ? fetch(`/sounds/${file}.mp3`)
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
  for (const { file } of Object.values(AUDIO.sounds)) void load(file)
}

export function setMuted(value: boolean): void {
  muted = value
}

export function isMuted(): boolean {
  return muted
}

/** Phát một âm. `pitch` lệch nhẹ để các âm lặp (bước nhảy, đồng xu) đỡ đơn điệu. */
export function playSound(name: SoundName, options: { pitch?: number; volume?: number } = {}): void {
  if (muted) return
  const ctx = getContext()
  if (!ctx || ctx.state !== 'running') return
  const sound = AUDIO.sounds[name]
  void load(sound.file).then((buffer) => {
    if (!buffer) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = options.pitch ?? 1
    const gain = ctx.createGain()
    gain.gain.value = AUDIO.masterVolume * sound.volume * (options.volume ?? 1)
    source.connect(gain).connect(ctx.destination)
    source.start()
  })
}
