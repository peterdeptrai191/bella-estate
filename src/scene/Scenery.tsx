/** Cây trang trí trên bãi cỏ (Kenney City Kit Suburban). */
import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Mesh, Object3D } from 'three'
import { useVisual } from '../store/visualStore'
import { centerTopY } from './boardLayout'

const url = (model: string) => `/models/city/${model}.glb`

function Prop({ model, position, rotationY, scale }: { model: string; position: [number, number, number]; rotationY: number; scale: number }) {
  const { scene } = useGLTF(url(model))
  const object = useMemo(() => {
    const o = scene.clone()
    o.traverse((c: Object3D) => {
      if ((c as Mesh).isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })
    return o
  }, [scene])
  return <primitive object={object} position={position} rotation-y={rotationY} scale={scale} />
}

export function Scenery() {
  const { scenery, board } = useVisual()
  if (!scenery.enabled) return null
  const y = centerTopY(board)
  return (
    <>
      {scenery.items.map((item, i) => (
        <Prop
          key={i}
          model={item.model}
          position={[item.x, y, item.z]}
          rotationY={(item.rotationDeg * Math.PI) / 180}
          scale={scenery.scale}
        />
      ))}
    </>
  )
}

for (const model of ['tree-large', 'tree-small', 'planter']) useGLTF.preload(url(model))
