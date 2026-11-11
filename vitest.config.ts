import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    env: {
      NODE_ENV: 'test',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'correct-horse-battery',
    },
  },
});
