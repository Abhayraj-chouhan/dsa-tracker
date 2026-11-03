import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Route all /api requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Keep LeetCode proxy as a fallback for direct client-side requests
      '/leetcode-proxy': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/leetcode-proxy/, ''),
        headers: {
          'Origin': 'https://leetcode.com',
          'Referer': 'https://leetcode.com/'
        }
      }
    }
  }
})
