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
    
    // Manual chunks para mejor splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React y React DOM en un chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase en otro chunk
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          // Bootstrap y icons
          'vendor-ui': ['react-bootstrap', 'bootstrap'],
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
