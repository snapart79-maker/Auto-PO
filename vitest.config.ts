import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/App.tsx',
        'src/main.tsx',
        'src/domain/repositories/**',
        'src/infrastructure/supabase/**',
        'src/infrastructure/repositories/**',
        'src/infrastructure/react/**',
      ],
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@interface': path.resolve(__dirname, './src/interface'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
})
