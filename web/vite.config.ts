import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = 'http://localhost:1749';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/health': API,
    },
  },
});
