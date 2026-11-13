import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, la web (5173) delega /api en el servidor (4000), incluido el WebSocket.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:4000', ws: true } } },
});
