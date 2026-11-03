import { OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'
import { useVisual } from '../store/visualStore'
import { cameraPosition, fitZoom } from './boardLayout'

const CAMERA_DISTANCE = 60

/** Camera orthographic cố định, góc isometric, tự co zoom để bàn cờ vừa khung hình. */
export function CameraRig() {
  const visual = useVisual()
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const ref = useRef<OrthographicCameraImpl>(null)

  useLayoutEffect(() => {
    const cam = ref.current
    if (!cam) return
    cam.position.set(...cameraPosition(visual.camera, CAMERA_DISTANCE))
    cam.lookAt(0, 0, 0)
    cam.zoom = fitZoom(visual, size.width, size.height)
    cam.updateProjectionMatrix()
    // frameloop="demand": sửa trực tiếp camera nên phải báo vẽ lại.
    invalidate()
  }, [visual, size.width, size.height, invalidate])

  return <OrthographicCamera ref={ref} makeDefault near={0.1} far={CAMERA_DISTANCE * 3} />
}
