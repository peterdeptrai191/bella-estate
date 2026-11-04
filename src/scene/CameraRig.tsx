import { OrthographicCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { type OrthographicCamera as OrthographicCameraImpl, Vector3 } from 'three'
import { useVisual } from '../store/visualStore'
import { cameraPosition, fitFrame, screenUp } from './boardLayout'
import { getFollowTarget } from './cameraControl'
import { getUserView } from '../store/viewControl'

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
  const offset = useRef(new Vector3())
  const focus = useRef(new Vector3())
  const zoomFactor = useRef(1)
  const scratch = useRef(new Vector3())
  const axes = useRef({ right: new Vector3(), up: new Vector3() })

  useLayoutEffect(() => {
    const frame = fitFrame(visual, size.width, size.height)
    fit.current = frame.zoom
    offset.current.set(...screenUp(visual.camera)).multiplyScalar(frame.offsetUp)
    const [px, , pz] = cameraPosition(visual.camera, 1)
    axes.current.right.set(pz, 0, -px).normalize()
    axes.current.up.set(...screenUp(visual.camera))
  }, [visual, size.width, size.height])

  useFrame((_, delta) => {
    const cam = ref.current
    if (!cam) return
    const a = visual.animation
    const k = 1 - Math.exp(-a.cameraFollowSpeed * Math.min(delta, 0.1))
    const followTarget = getFollowTarget()
    const user = getUserView()
    // Không có quân đang đi: nhìn theo góc người chơi đã zoom/kéo (tâm bàn cờ + độ dời).
    const target = followTarget
      ? followTarget.getWorldPosition(scratch.current).setY(0)
      : scratch.current
          .copy(offset.current)
          .addScaledVector(axes.current.right, user.panRight)
          .addScaledVector(axes.current.up, user.panUp)
    // Kéo/zoom tay thì camera theo ngay; bám quân hoặc quay về thì trượt mượt.
    if (followTarget) focus.current.lerp(target, k)
    else focus.current.lerp(target, Math.max(k, 0.5))
    const wantZoom = followTarget ? Math.max(user.zoom, a.cameraFollowZoom) : user.zoom
    zoomFactor.current += (wantZoom - zoomFactor.current) * (followTarget ? k : Math.max(k, 0.5))

    const [x, y, z] = cameraPosition(visual.camera, CAMERA_DISTANCE)
    cam.position.set(x + focus.current.x, y + focus.current.y, z + focus.current.z)
    cam.lookAt(focus.current)
    cam.zoom = fit.current * zoomFactor.current
    cam.updateProjectionMatrix()
  })

  return <OrthographicCamera ref={ref} makeDefault near={0.1} far={CAMERA_DISTANCE * 3} />
}
