import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/app.ts', 'src/data/db/index.ts', 'api/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  target: 'node20',
  bundle: true, // do not delete this line !!!!!!!!!!!!!!!!!!!!!!!!!!!
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
      '@shared': './src/shared-types',
    }
  },
})
