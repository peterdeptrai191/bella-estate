/**
 * Quân cờ: model GLB (Kenney) đứng trên đế tròn màu người chơi.
 * Vị trí nghỉ lấy từ view; khi đang nhảy/bay thì event player điều khiển trực tiếp qua các hàm bên dưới.
 */
import { useAnimations, useGLTF } from '@react-three/drei'
import gsap from 'gsap'
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, type Group, type Mesh, type Object3D } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { VISUAL } from '../config/visual'
import { useAnimationStore } from '../store/animationStore'
import { useVisual } from '../store/visualStore'
import { computeTileLayout, piecePlacement, tileTopY } from './boardLayout'
import { Mat } from './Mat'
import { controlled, pieceRefs } from './pieceControl'


export function Pieces() {
  const view = useAnimationStore((s) => s.view)
  const visual = useVisual()
  const layout = useMemo(() => computeTileLayout(visual.board), [visual.board])
  if (!view) return null
  const placement = piecePlacement(view.players, layout, visual.pieces)
  const models = visual.pieces.models
  return (
    <>
      {view.players.map((p) => (
        <Suspense key={p.id} fallback={null}>
          <Piece
            id={p.id}
            url={models[p.seat % models.length]}
            color={visual.playerColors[p.seat % visual.playerColors.length]}
            target={placement.get(p.id) ?? null}
          />
        </Suspense>
      ))}
    </>
  )
}

function Piece({ id, url, color, target }: { id: string; url: string; color: string; target: [number, number] | null }) {
  const { pieces, board, animation } = useVisual()
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const placed = useRef(false)
  const { scene, animations } = useGLTF(url)

  const { model, scale, offsetY } = useMemo(() => {
    const m = cloneSkinned(scene)
    m.traverse((o: Object3D) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    // Chuẩn hoá: mọi model (người hay thú) đều co về cùng chiều cao, chân chạm đế.
    const box = new Box3().setFromObject(m)
    const height = Math.max(0.001, box.max.y - box.min.y)
    return { model: m, scale: 1 / height, offsetY: -box.min.y }
  }, [scene])
  const { actions } = useAnimations(animations, model)

  useLayoutEffect(() => {
    const idle = actions.idle ?? Object.values(actions)[0]
    idle?.reset().fadeIn(0.2).play()
    return () => {
      idle?.fadeOut(0.2)
    }
  }, [actions])

  useLayoutEffect(() => {
    if (root.current && body.current) pieceRefs.set(id, { root: root.current, body: body.current })
    return () => {
      pieceRefs.delete(id)
    }
  }, [id])

  // Về đúng chỗ nghỉ khi view đổi (quân khác tới/rời ô) — trừ lúc đang được điều khiển.
  useLayoutEffect(() => {
    const g = root.current
    if (!g) return
    g.visible = target !== null
    if (!target || controlled.has(id)) return
    const y = tileTopY(board)
    if (!placed.current) {
      g.position.set(target[0], y, target[1])
      if (body.current) body.current.rotation.y = Math.PI / 4
      placed.current = true
      return
    }
    gsap.to(g.position, { x: target[0], y, z: target[1], duration: animation.restackDuration, ease: 'power2.out' })
  }, [target, id, board, animation.restackDuration])

  const modelScale = scale * pieces.height
  return (
    <group ref={root}>
      <group ref={body}>
        <mesh position={[0, pieces.baseHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[pieces.baseRadius, pieces.baseRadius * 1.1, pieces.baseHeight, 24]} />
          <Mat color={color} />
        </mesh>
        <primitive object={model} scale={modelScale} position-y={pieces.baseHeight + offsetY * modelScale} />
      </group>
    </group>
  )
}

for (const url of VISUAL.pieces.models) useGLTF.preload(url)
