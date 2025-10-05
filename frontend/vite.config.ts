import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000' } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    coverage: { 
      provider: 'v8', 
      reporter: ['text', 'html', 'lcov'], 
      reportsDirectory: 'coverage' 
    }
  }
})
