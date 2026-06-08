import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/WC2026/',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/api/football': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_FOOTBALL_DATA_KEY || ''
            if (key) proxyReq.setHeader('X-Auth-Token', key)
          })
        },
      },
    },
  },
})
