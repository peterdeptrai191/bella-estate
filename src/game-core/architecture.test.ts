import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Bảo vệ quy tắc kiến trúc: game-core và config phải là TypeScript thuần,
 * để sau này chạy được trên server multiplayer.
 */
const FORBIDDEN = [/^react/, /^three/, /^@react-three\//, /^zustand/, /\/scene\//, /\/ui\//, /\/store\//]

function listTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listTsFiles(full)
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') ? [full] : []
  })
}

function importsOf(file: string): string[] {
  const src = readFileSync(file, 'utf8')
  return [...src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
    (m) => m[1] ?? m[2],
  )
}

describe.each(['src/game-core', 'src/config'])('%s là TypeScript thuần', (dir) => {
  it('không import React, Three.js, Zustand hay UI', () => {
    const violations = listTsFiles(dir).flatMap((file) =>
      importsOf(file)
        .filter((spec) => FORBIDDEN.some((re) => re.test(spec)))
        .map((spec) => `${file} → ${spec}`),
    )
    expect(violations).toEqual([])
  })

  it('không dùng .tsx', () => {
    expect(listTsFiles(dir).filter((f) => f.endsWith('.tsx'))).toEqual([])
  })
})
