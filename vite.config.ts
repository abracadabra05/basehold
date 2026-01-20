import { defineConfig } from 'vite';

export default defineConfig({
  // Используем относительный путь './', чтобы игра работала:
  // 1. На GitHub Pages (https://user.github.io/repo/)
  // 2. В Яндекс.Играх (в iframe)
  // 3. На itch.io
  // 4. Локально
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
