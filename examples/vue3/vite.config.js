import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue-pivottable/multi-value-renderer/vue3': path.resolve(__dirname, '../../src/vue3/index.js'),
      '@vue-pivottable/multi-value-renderer/styles.css': path.resolve(__dirname, '../../src/styles.css')
    }
  }
})
