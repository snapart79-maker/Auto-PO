import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@interface': path.resolve(__dirname, './src/interface'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
})
