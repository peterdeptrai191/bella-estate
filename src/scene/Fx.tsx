import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'
import { setFxRoot } from './fxControl'

/** Lớp chứa hiệu ứng tạm thời (tiền bay, bụi). */
export function FxLayer() {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    setFxRoot(ref.current)
    return () => setFxRoot(null)
  }, [])
  return <group ref={ref} />
}
