import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@unipay/core': path.resolve(__dirname, './packages/core/src'),
      '@unipay/utils': path.resolve(__dirname, './packages/utils/src'),
      '@unipay/adapter-stripe': path.resolve(__dirname, './packages/adapter-stripe/src'),
      '@unipay/adapter-razorpay': path.resolve(__dirname, './packages/adapter-razorpay/src'),
      '@unipay/adapter-paypal': path.resolve(__dirname, './packages/adapter-paypal/src'),
      '@unipay/client': path.resolve(__dirname, './packages/client/src'),
    },
  },
});
