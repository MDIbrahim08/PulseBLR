import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for Node.js SDKs used in browser context (e.g. @armoriq/sdk)
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

