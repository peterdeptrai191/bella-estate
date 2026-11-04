// Bundle API chơi online thành một file JS cho Vercel: api/estate.js (sinh tự động, đừng sửa tay).
import { build } from 'esbuild'

export const apiBuildOptions = {
  entryPoints: ['src/online/vercel.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  banner: { js: '// Tệp sinh tự động bởi `npm run build:api` từ src/online/. Đừng sửa tay.' },
  logLevel: 'warning',
}

if (process.argv[1] && process.argv[1].endsWith('build-api.mjs')) {
  await build({ ...apiBuildOptions, outfile: 'api/estate.js' })
  console.log('api/estate.js đã cập nhật')
}
