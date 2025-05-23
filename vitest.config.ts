import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // Optional: create this file for global test setup
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      'e2e/**' // Exclude e2e tests from Vitest execution
    ],
    coverage: {
      provider: 'v8', // Changed from c8 to v8
      reporter: ['text', 'json', 'html', 'lcov'], // Added lcov for CI coverage reporting
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/types/**',
        'src/**/index.ts',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        'src/app/**', // Excluding app router for now, focus on lib/hooks
        'src/pages/api/**', // API routes tested differently (e.g. integration/e2e)
        'src/context/**', // Context might be complex to unit test directly
        'src/components/ui/**', // UI components can be tested, but focusing on lib/hooks first
        'src/lib/logger.ts', // Logger is mostly console wrapper
        'src/lib/i18n.ts', // i18n setup
        'e2e/**', // Exclude e2e tests from Vitest - REVERTED TO THIS
        // Add other files/patterns to exclude from coverage goals if not unit testable
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 