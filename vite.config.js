import { defineConfig } from 'vite'
import { resolve } from 'path'

// Build each entry separately to avoid code splitting issues
const createConfig = (entryName, entryPath) => ({
  build: {
    lib: {
      entry: resolve(__dirname, entryPath),
      name: entryName,
      formats: ['es', 'cjs'],
      fileName: (format) => {
        const ext = format === 'es' ? 'mjs' : 'js'
        return `${entryName}.${ext}`
      }
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: ['vue', 'vue-pivottable'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-pivottable': 'VuePivottable'
        }
      }
    },
    minify: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

// Default config builds all entries together
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        vue2: resolve(__dirname, 'src/vue2/index.js'),
        vue3: resolve(__dirname, 'src/vue3/index.js'),
        core: resolve(__dirname, 'src/core/index.js')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js'
        return `${entryName}.${ext}`
      }
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['vue', 'vue-pivottable'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-pivottable': 'VuePivottable'
        },
        // Preserve module structure
        preserveModules: false,
        // Ensure chunks have consistent names
        chunkFileNames: '[name].js'
      }
    },
    minify: false,
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
