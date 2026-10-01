import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    ...(process.env.PLAYWRIGHT_CHROME_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } } : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'root', use: { baseURL: 'http://127.0.0.1:4173/' } },
    { name: 'project-prefix', use: { baseURL: 'http://127.0.0.1:4174/Wuthering-Waves-Plot-Analysis/' } }
  ],
  webServer: [
    { command: 'npm run preview', url: 'http://127.0.0.1:4173/', reuseExistingServer: false },
    { command: 'npm run preview', env: { PORT: '4174', PREVIEW_BASE_PATH: '/Wuthering-Waves-Plot-Analysis/' }, url: 'http://127.0.0.1:4174/Wuthering-Waves-Plot-Analysis/', reuseExistingServer: false }
  ]
});
