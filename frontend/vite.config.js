import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes on your LAN IP so you can open it on your actual phone
    port: 5173,
  },
});
