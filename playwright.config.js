import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5000' },
  webServer: {
    command: 'npm start', // vite build + node server.js — client SSE hardcodes :5000
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
