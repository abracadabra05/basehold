import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/logic/**/*.ts', 'src/constants/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts']
    }
  }
});
