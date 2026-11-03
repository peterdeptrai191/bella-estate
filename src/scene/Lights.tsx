import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'
import { useVisual } from '../store/visualStore'
import { boardLength, cameraPosition } from './boardLayout'

/** HemisphereLight làm nền + 1 DirectionalLight chiếu chéo đổ bóng mềm. */
export function Lights() {
  const { lights, board } = useVisual()
  const ref = useRef<DirectionalLight>(null)
  const invalidate = useThree((s) => s.invalidate)
  const reach = boardLength(board) / 2 + board.baseMargin + 1
  const sunPosition = cameraPosition(
    { elevationDeg: lights.sun.elevationDeg, azimuthDeg: lights.sun.azimuthDeg, fitPadding: 1 },
    reach * 3,
  )

  useLayoutEffect(() => {
    const light = ref.current
    if (!light) return
    const shadow = light.shadow
    const cam = shadow.camera
    cam.left = -reach * 1.2
    cam.right = reach * 1.2
    cam.top = reach * 1.2
    cam.bottom = -reach * 1.2
    cam.near = 0.1
    cam.far = reach * 7
    cam.updateProjectionMatrix()
    if (shadow.mapSize.x !== lights.shadow.mapSize) {
      shadow.mapSize.set(lights.shadow.mapSize, lights.shadow.mapSize)
      shadow.map?.dispose()
      shadow.map = null
    }
    shadow.radius = lights.shadow.radius
    shadow.bias = lights.shadow.bias
    shadow.normalBias = lights.shadow.normalBias
    shadow.needsUpdate = true
    invalidate()
  }, [lights.shadow, reach, invalidate])

  return (
    <>
      <hemisphereLight args={[lights.hemisphere.sky, lights.hemisphere.ground, lights.hemisphere.intensity]} />
      <directionalLight
        ref={ref}
        castShadow
        color={lights.sun.color}
        intensity={lights.sun.intensity}
        position={sunPosition}
      />
    </>
  )
}
