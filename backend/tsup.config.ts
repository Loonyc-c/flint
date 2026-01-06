import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/app.ts', 'src/data/db/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
      '@shared': './src/shared-types',
    }
  },
})

