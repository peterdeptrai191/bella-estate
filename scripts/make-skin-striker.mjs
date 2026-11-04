/**
 * Tạo skin "Tiền đạo Đỏ" từ nhân vật Kenney male-a (CC0): áo đấu đỏ vai đen, quần trắng, giày đen, bỏ kính.
 * Nhân vật Kenney tô màu bằng bảng màu (colormap 512x512, ô 32px); skin mới nhúng một bảng màu riêng
 * nên không ảnh hưởng nhân vật khác. Chạy: node scripts/make-skin-striker.mjs
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { PNG } from 'pngjs'
import { readFileSync } from 'node:fs'

const SRC = 'public/models/characters/character-male-a.glb'
const OUT = 'public/models/characters/character-striker.glb'
const CELL = 32

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(SRC)

// 1) Bỏ kính: các tam giác ở đầu dùng ô màu cột 7 (gọng) và cột 9 (mắt kính), hàng dưới.
for (const mesh of doc.getRoot().listMeshes()) {
  if (mesh.getName() !== 'head-mesh') continue
  for (const prim of mesh.listPrimitives()) {
    const uv = prim.getAttribute('TEXCOORD_0')
    const indices = prim.getIndices()
    const glasses = (i) => {
      const [u, v] = uv.getElement(i, [])
      const col = Math.floor(u * 16)
      return v >= 0.75 && (col === 7 || col === 9)
    }
    const keep = []
    const arr = indices.getArray()
    for (let t = 0; t < arr.length; t += 3) {
      if (glasses(arr[t]) || glasses(arr[t + 1]) || glasses(arr[t + 2])) continue
      keep.push(arr[t], arr[t + 1], arr[t + 2])
    }
    indices.setArray(new arr.constructor(keep))
  }
}

// 2) Bảng màu riêng.
const png = PNG.sync.read(readFileSync('public/models/characters/Textures/colormap.png'))
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))
/** Tô cột `col` (hàng màu 256–383 px) theo hàm màu của toạ độ y. */
function paint(col, colorAt) {
  for (let y = 256; y < 384; y++) {
    const c = colorAt(y)
    for (let x = col * CELL; x < (col + 1) * CELL; x++) {
      const i = (y * png.width + x) * 4
      png.data[i] = c[0]
      png.data[i + 1] = c[1]
      png.data[i + 2] = c[2]
      png.data[i + 3] = 255
    }
  }
}
const RED_TOP = hex('#ef3340')
const RED_BOTTOM = hex('#c8102e')
const BLACK = hex('#26262c')
// Áo (cột 3): mép vai/cổ (v≈269px) đen, thân đỏ đậm dần xuống gấu.
paint(3, (y) => (y < 274 ? BLACK : mix(RED_TOP, RED_BOTTOM, (y - 274) / 110)))
// Quần (cột 11): trắng hơi xám ở dưới.
paint(11, (y) => mix(hex('#ffffff'), hex('#dfe3ec'), (y - 256) / 128))
// Thắt lưng (cột 11, hàng màu da 384–511 px — chỉ thắt lưng dùng ô này): trắng như quần.
for (let y = 384; y < 512; y++) for (let x = 11 * CELL; x < 12 * CELL; x++) {
  const i = (y * png.width + x) * 4
  png.data.set([236, 239, 245, 255], i)
}
// Giày (cột 5): đen.
paint(5, (y) => mix(hex('#3a3a42'), hex('#1c1c22'), (y - 256) / 128))

const texture = doc.getRoot().listTextures()[0]
texture.setImage(PNG.sync.write(png)).setMimeType('image/png').setURI('colormap-striker.png')
await io.write(OUT, doc)
console.log('Đã tạo', OUT)
