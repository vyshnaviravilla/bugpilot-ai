import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser only talks to Vite (5173). Vite forwards /api to FastAPI (8000),
// so there are no CORS problems and no API keys ever reach the frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
});
