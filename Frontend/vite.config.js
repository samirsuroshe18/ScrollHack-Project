import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_SERVER = 'http://localhost:3000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // the backend builds email links from FRONTEND_URL, so the port must not drift
    port: 5174,
    strictPort: true,
    // one origin for the browser: the auth cookies need no cross-site setup
    proxy: {
      '/api': API_SERVER,
      '/socket.io': { target: API_SERVER, ws: true },
    },
  },
})
