import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Важно для Yandex Games
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});