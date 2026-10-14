import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Guarantees no test can reach a real database even if a mock is missing.
    env: {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
      NEXTAUTH_SECRET: 'test-nextauth-secret',
      OTP_HASH_SECRET: 'test-otp-secret',
    },
  },
})
