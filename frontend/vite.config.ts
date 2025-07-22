// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path' // Necesitamos importar 'path' de Node.js

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- AÑADIMOS ESTA SECCIÓN ---
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})