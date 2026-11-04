import { useEffect, useRef, useState } from 'react'

/** Số chạy mượt từ giá trị cũ tới giá trị mới trong `seconds` giây (ease-out). */
export function useCountUp(target: number, seconds: number): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const shown = useRef(target)

  useEffect(() => {
    from.current = shown.current
    if (from.current === target) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (seconds * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      const v = Math.round(from.current + (target - from.current) * eased)
      shown.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, seconds])

  return value
}

/** Thời gian còn lại (0..1) tới `endsAt`, cập nhật mỗi khung hình. */
export function useRemaining(startedAt: number | null, endsAt: number | null): number {
  const [remaining, setRemaining] = useState(1)
  useEffect(() => {
    if (startedAt === null || endsAt === null) return
    let frame = 0
    const tick = () => {
      const r = Math.max(0, Math.min(1, (endsAt - Date.now()) / (endsAt - startedAt)))
      setRemaining(r)
      if (r > 0) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [startedAt, endsAt])
  return startedAt === null ? 1 : remaining
}
