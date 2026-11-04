/**
 * Bảng leva chỉnh trực tiếp thông số trong config/visual.ts. CHỈ nạp ở chế độ dev (xem App.tsx).
 * Thanh trượt được sinh tự động từ cấu trúc VISUAL, nên thêm thông số mới vào visual.ts
 * là bảng tự có thêm thanh trượt.
 */
import { button, folder, Leva, useControls } from 'leva'
import { useEffect, useMemo } from 'react'
import { VISUAL, type VisualConfig } from '../../config/visual'
import { useVisualStore } from '../../store/visualStore'

const SEP = '__'
const SKIP_KEYS = new Set(['buildings', 'items']) // preview.buildings: danh sách nhà mẫu, không chỉnh bằng thanh trượt

type Control = { value: number | string | boolean; label: string; min?: number; max?: number; step?: number; options?: number[] }
type SchemaNode = Control | ReturnType<typeof folder>
type Schema = Record<string, SchemaNode>
type FolderSchema = Parameters<typeof folder>[0]

function numberRange(name: string, value: number): Pick<Control, 'min' | 'max' | 'step' | 'options'> {
  if (name === 'mapSize') return { options: [512, 1024, 2048, 4096] }
  if (name === 'elevationDeg') return { min: 5, max: 90, step: 1 }
  if (name.endsWith('Deg')) return { min: 0, max: 360, step: 1 }
  if (name === 'bias') return { min: -0.005, max: 0.005, step: 0.0001 }
  if (name === 'normalBias') return { min: 0, max: 0.1, step: 0.001 }
  if (name === 'tileSmoothness') return { min: 1, max: 10, step: 1 }
  if (name === 'fitPadding') return { min: 0.8, max: 2, step: 0.01 }
  if (/roughness|metalness|opacity|ratio|Ratio/.test(name)) return { min: 0, max: 1, step: 0.01 }
  if (/intensity/i.test(name)) return { min: 0, max: 6, step: 0.05 }
  if (name === 'radius' && value > 2) return { min: 0, max: 20, step: 0.5 }
  return { min: 0, max: Math.max(1, Math.ceil(value * 3)), step: 0.01 }
}

function buildSchema(obj: Record<string, unknown>, path: string[] = []): Schema {
  const schema: Schema = {}
  for (const [name, value] of Object.entries(obj)) {
    if (SKIP_KEYS.has(name)) continue
    const keyPath = [...path, name]
    const key = keyPath.join(SEP)
    if (Array.isArray(value)) {
      const items: Schema = {}
      value.forEach((item, i) => {
        if (typeof item === 'string') items[`${key}${SEP}${i}`] = { value: item, label: `${name} ${i + 1}` }
      })
      if (Object.keys(items).length > 0) {
        schema[keyPath.join(' › ')] = folder(items as unknown as FolderSchema, { collapsed: true })
      }
    } else if (value && typeof value === 'object') {
      schema[keyPath.join(' › ')] = folder(buildSchema(value as Record<string, unknown>, keyPath) as unknown as FolderSchema, {
        collapsed: path.length > 0 || name !== 'camera',
      })
    } else if (typeof value === 'number') {
      schema[key] = { value, label: name, ...numberRange(name, value) }
    } else if (typeof value === 'string' || typeof value === 'boolean') {
      schema[key] = { value, label: name }
    }
  }
  return schema
}

/** Ghép các giá trị phẳng (camera__zoom) trở lại thành cấu trúc VISUAL. */
function unflatten(values: Record<string, unknown>): VisualConfig {
  const result = structuredClone(VISUAL)
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split(SEP)
    let node: Record<string, unknown> = result as unknown as Record<string, unknown>
    for (const part of parts.slice(0, -1)) node = node[part] as Record<string, unknown>
    node[parts[parts.length - 1]] = value
  }
  return result
}

/** Chuỗi để dán đè vào `export const VISUAL = ...` trong config/visual.ts. */
function toSource(visual: VisualConfig): string {
  const body = JSON.stringify(visual, null, 2).replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:').replace(/"/g, "'")
  return `export const VISUAL = ${body}\n`
}

export function VisualTuner() {
  const setVisual = useVisualStore((s) => s.setVisual)
  const schema = useMemo(() => buildSchema(VISUAL as unknown as Record<string, unknown>), [])
  const values = useControls(schema as unknown as Parameters<typeof useControls>[0]) as Record<string, unknown>

  useControls('Xuất cấu hình', {
    'Copy cấu hình': button(() => {
      const source = toSource(useVisualStore.getState().visual)
      void navigator.clipboard?.writeText(source)
      console.info('[visual] Đã copy. Dán đè khối VISUAL trong src/config/visual.ts:\n' + source)
    }),
  })

  useEffect(() => {
    setVisual(unflatten(values))
  }, [values, setVisual])

  // Đặt bên phải, dưới khung người chơi góc trên để không che HUD.
  return (
    <div className="fixed right-3 top-28 z-50 max-h-[calc(100%-11rem)] w-[360px] max-w-[calc(100%-1.5rem)] overflow-auto">
      <Leva
        fill
        collapsed
        titleBar={{ title: 'Visual (dev)' }}
        theme={{ sizes: { rootWidth: '360px', controlWidth: '170px' } }}
      />
    </div>
  )
}
