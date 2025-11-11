import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __WS_TOKEN__: JSON.stringify(''),
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    }
  }
})
