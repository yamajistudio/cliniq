import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Playwright e2e e testes de integração RLS rodam com seus próprios runners
    exclude: [
      'tests/e2e/**',
      'tests/rls/**',
      'node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 60, functions: 60, branches: 60 },
      include: ['services/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'services/**/*.test.ts',
        'lib/**/*.test.ts',
        'lib/supabase/**',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
