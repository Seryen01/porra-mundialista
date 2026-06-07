import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/app/api/**'],
      exclude: ['src/app/api/auth/**'],
    },
  },
  resolve: {
    alias: {
      // @/* → src/* (igual que tsconfig paths)
      '@': path.resolve(__dirname, './src'),
    },
  },
})
