import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    // Optimisation du bundle size avec code splitting manuel
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les grandes librairies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-socket': ['socket.io-client'],
        }
      }
    },
    // Optimiser la taille des chunks
    chunkSizeWarningLimit: 600,
  },
  // Optimiser les dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
