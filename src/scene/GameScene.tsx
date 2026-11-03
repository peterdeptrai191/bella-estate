import { ContactShadows, OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { GRAPHICS } from '../config/graphics'

/** Scene 3D trống: camera isometric cố định, ánh sáng chéo, nền nhận bóng. */
export function GameScene() {
  const { camera, light, ground, background } = GRAPHICS

  return (
    <Canvas shadows dpr={[1, 2]} className="absolute inset-0">
      <color attach="background" args={[background]} />

      <OrthographicCamera
        makeDefault
        position={camera.position}
        zoom={camera.zoom}
        near={camera.near}
        far={camera.far}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />

      <ambientLight intensity={light.ambientIntensity} />
      <directionalLight
        castShadow
        position={light.sunPosition}
        intensity={light.sunIntensity}
        shadow-mapSize={[light.shadowMapSize, light.shadowMapSize]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ground.size, ground.size]} />
        <meshStandardMaterial color={ground.color} />
      </mesh>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={20} blur={2.5} far={6} />
    </Canvas>
  )
}
