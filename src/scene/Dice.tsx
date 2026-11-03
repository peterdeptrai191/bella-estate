/** Hai viên xúc xắc bo tròn ở giữa bàn cờ (animation tung nằm ở diceControl.ts). */
import { RoundedBox } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { useAnimationStore } from '../store/animationStore'
import { useVisual } from '../store/visualStore'
import { diceRestPositions } from './boardLayout'
import { dieRefs } from './diceControl'
import { FACES, faceRotation, pipLayout } from './diceMath'
import { Mat } from './Mat'


export function Dice() {
  const visual = useVisual()
  const rest = useMemo(() => diceRestPositions(visual), [visual])
  return (
    <>
      <Die index={0} rest={rest[0]} />
      <Die index={1} rest={rest[1]} />
    </>
  )
}

function Die({ index, rest }: { index: number; rest: [number, number, number] }) {
  const { dice } = useVisual()
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)

  useLayoutEffect(() => {
    if (!outer.current || !inner.current) return
    dieRefs[index] = { outer: outer.current, inner: inner.current }
    // Mặt hiển thị ban đầu lấy theo view.
    const initial = useAnimationStore.getState().view?.dice ?? [5, 3]
    const r = faceRotation(initial[index])
    inner.current.rotation.set(r.x, 0, r.z)
    outer.current.rotation.y = index === 0 ? 0.35 : -0.25
    return () => {
      dieRefs[index] = null
    }
  }, [index])

  useLayoutEffect(() => {
    outer.current?.position.set(...rest)
  }, [rest])

  const s = dice.size
  const pipR = s * dice.pipRatio
  const grid = s * 0.27
  return (
    <group ref={outer}>
      <group ref={inner}>
        <RoundedBox args={[s, s, s]} radius={s * dice.roundness} smoothness={5} castShadow receiveShadow>
          <Mat color={dice.color} />
        </RoundedBox>
        {FACES.flatMap((face) =>
          pipLayout(face.value).map(([a, b], i) => {
            const pos = [0, 1, 2].map((k) => face.normal[k] * (s / 2) + face.u[k] * a * grid + face.v[k] * b * grid) as [
              number,
              number,
              number,
            ]
            const rot: [number, number, number] =
              face.normal[0] !== 0 ? [0, 0, Math.PI / 2] : face.normal[2] !== 0 ? [Math.PI / 2, 0, 0] : [0, 0, 0]
            return (
              <mesh key={`${face.value}-${i}`} position={pos} rotation={rot}>
                <cylinderGeometry args={[pipR, pipR, s * 0.04, 16]} />
                <Mat color={dice.pipColor} />
              </mesh>
            )
          }),
        )}
      </group>
    </group>
  )
}
