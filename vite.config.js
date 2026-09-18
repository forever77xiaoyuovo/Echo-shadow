import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Echo-shadow/',
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false
  }
});
