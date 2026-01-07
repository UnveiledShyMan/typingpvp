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
        manualChunks: (id) => {
          // Séparer les grandes librairies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Autres dépendances
            return 'vendor-misc';
          }
          
          // Séparer les pages par route pour lazy loading optimal
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('/')[0];
            if (pageName) {
              return `page-${pageName}`;
            }
          }
        }
      }
    },
    // Optimiser la taille des chunks
    chunkSizeWarningLimit: 600,
    // Minification agressive
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true,
      },
    },
  },
  // Optimiser les dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['recharts'] // Exclure recharts du pre-bundling (lazy load)
  }
})
