import { useVisual } from '../store/visualStore'

/** Vật liệu chuẩn của game: MeshStandardMaterial nhám, màu pastel. */
export function Mat({ color }: { color: string }) {
  const { material } = useVisual()
  return <meshStandardMaterial color={color} roughness={material.roughness} metalness={material.metalness} />
}
