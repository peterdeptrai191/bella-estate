import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { useVisual } from '../store/visualStore'

/** Ambient occlusion (N8AO) — làm tối nhẹ các góc khuất, chân nhà, khe giữa các ô. */
export function Effects() {
  const { ao } = useVisual()
  if (!ao.enabled) return null
  return (
    <EffectComposer multisampling={4}>
      <N8AO
        aoRadius={ao.radius}
        intensity={ao.intensity}
        distanceFalloff={ao.distanceFalloff}
        color={ao.color}
        quality="medium"
      />
    </EffectComposer>
  )
}
