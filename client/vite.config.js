import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/scores': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/move': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

