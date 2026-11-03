import { OrthographicCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { type OrthographicCamera as OrthographicCameraImpl, Vector3 } from 'three'
import { useVisual } from '../store/visualStore'
import { cameraPosition, fitZoom } from './boardLayout'
import { getFollowTarget } from './cameraControl'

const CAMERA_DISTANCE = 60

/**
 * Camera orthographic cố định góc isometric, tự co zoom vừa khung hình.
 * Khi có quân đang đi: trượt theo quân và zoom nhẹ, đi xong thì trở về.
 */
export function CameraRig() {
  const visual = useVisual()
  const size = useThree((s) => s.size)
  const ref = useRef<OrthographicCameraImpl>(null)
  const fit = useRef(1)
  const focus = useRef(new Vector3())
  const zoomFactor = useRef(1)
  const scratch = useRef(new Vector3())

  useLayoutEffect(() => {
    fit.current = fitZoom(visual, size.width, size.height)
  }, [visual, size.width, size.height])

  useFrame((_, delta) => {
    const cam = ref.current
    if (!cam) return
    const a = visual.animation
    const k = 1 - Math.exp(-a.cameraFollowSpeed * Math.min(delta, 0.1))
    const followTarget = getFollowTarget()
    const target = followTarget ? followTarget.getWorldPosition(scratch.current).setY(0) : scratch.current.set(0, 0, 0)
    focus.current.lerp(target, k)
    zoomFactor.current += ((followTarget ? a.cameraFollowZoom : 1) - zoomFactor.current) * k

    const [x, y, z] = cameraPosition(visual.camera, CAMERA_DISTANCE)
    cam.position.set(x + focus.current.x, y, z + focus.current.z)
    cam.lookAt(focus.current)
    cam.zoom = fit.current * zoomFactor.current
    cam.updateProjectionMatrix()
  })

  return <OrthographicCamera ref={ref} makeDefault near={0.1} far={CAMERA_DISTANCE * 3} />
}
