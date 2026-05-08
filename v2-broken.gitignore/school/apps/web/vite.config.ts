import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/SCHOOL': 'http://localhost:8080',
      '/assets': 'http://localhost:8080',
    },
    fs: {
      // Allow serving SCHOOL/ via the public/SCHOOL symlink (target lives at repo root).
      allow: ['..', '../..'],
    },
  },
});
