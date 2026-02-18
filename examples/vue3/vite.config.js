import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue-pivottable/multi-value-renderer': path.resolve(__dirname, '../../src/vue3/index.js'),
      'vue-pivottable/dist/vue-pivottable.css': path.resolve(__dirname, '../../../vue3-pivottable/dist/vue-pivottable.css'),
      'vue-pivottable': path.resolve(__dirname, '../../../vue3-pivottable/dist/vue-pivottable.es.js')
    }
  },
  optimizeDeps: {
    include: ['vue-pivottable']
  }
})
