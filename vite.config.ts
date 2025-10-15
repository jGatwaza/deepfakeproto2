import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define env vars available in code
  define: {
    'process.env.VITE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  // Add API proxy for development if needed
  server: {
    proxy: {
      // In case we want to use a real API during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
