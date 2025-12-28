import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test/e2e',

  /* 병렬 실행 */
  fullyParallel: true,

  /* CI에서 재시도 방지 */
  forbidOnly: !!process.env.CI,

  /* 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,

  /* 병렬 워커 수 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  /* 공통 설정 */
  use: {
    /* 기본 URL */
    baseURL: 'http://localhost:5173',

    /* 스크린샷 - 실패 시에만 */
    screenshot: 'only-on-failure',

    /* 트레이스 - 첫 재시도에만 */
    trace: 'on-first-retry',

    /* 비디오 - 실패 시에만 */
    video: 'on-first-retry',
  },

  /* 프로젝트 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 개발 서버 */
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
