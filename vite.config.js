import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Alias para imports más limpios
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Optimizaciones de build
  build: {
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
    
    // Manual chunks para mejor splitting (Vite 8 / Rolldown API)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('bootstrap')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },

  // Optimizaciones de desarrollo
  server: {
    port: 5173,
    open: false,
  },

  // Optimizaciones de preview
  preview: {
    port: 4173,
  },
})
