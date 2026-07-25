import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'pinia'],
      dts: false
    })
  ],
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#features': fileURLToPath(new URL('./features', import.meta.url)),
      '#server': fileURLToPath(new URL('./server', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.{test,spec}.ts',
      'tests/integration/**/*.{test,spec}.ts',
      'tests/components/**/*.{test,spec}.ts'
    ],
    environmentMatchGlobs: [
      ['tests/components/**', 'happy-dom']
    ],
    coverage: {
      reporter: ['text', 'html']
    }
  }
})
