import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.test.{js,ts}', 'src/types.ts'],
      // Thresholds set just below current actuals so CI fails on regression.
      // Current (2026-05): lines 92, statements 91, functions 95, branches 83.
      // Raise these when you add tests that improve coverage.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 88,
      },
    },
  },
})
