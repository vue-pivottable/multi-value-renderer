import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue2()],
  resolve: {
    alias: {
      '@vue-pivottable/multi-value-renderer/vue2': path.resolve(__dirname, '../../src/vue2/index.js'),
      'vue-pivottable/dist/vue-pivottable.css': path.resolve(__dirname, '../../../../projects-v1/vue-pivottable/dist/vue-pivottable.css'),
      'vue-pivottable': path.resolve(__dirname, '../../../../projects-v1/vue-pivottable/dist/vue-pivottable.mjs')
    }
  },
  optimizeDeps: {
    include: ['vue-pivottable']
  }
})
