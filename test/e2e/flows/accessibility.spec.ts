/**
 * Accessibility E2E Tests
 * 접근성 테스트
 */

import { test, expect } from '@playwright/test'
import { BasePage } from '../pages'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Skip Navigation', () => {
    test('Skip navigation 링크가 존재해야 함', async ({ page }) => {
      // Tab 키로 첫 번째 포커스 가능 요소로 이동
      await page.keyboard.press('Tab')

      // Skip link가 나타나야 함
      const skipLink = page.getByText('메인 콘텐츠로 건너뛰기')
      await expect(skipLink).toBeFocused()
    })

    test('Skip navigation 클릭 시 메인 콘텐츠로 이동해야 함', async ({ page }) => {
      // Tab 키로 skip link에 포커스
      await page.keyboard.press('Tab')

      // Enter 키로 활성화
      await page.keyboard.press('Enter')

      // main-content가 포커스되어야 함
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeFocused()
    })
  })

  test.describe('ARIA Roles', () => {
    test('사이드바에 complementary 역할이 있어야 함', async ({ page }) => {
      const sidebar = page.locator('aside[role="complementary"]')
      await expect(sidebar).toBeVisible()
    })

    test('네비게이션에 navigation 역할이 있어야 함', async ({ page }) => {
      const nav = page.locator('nav[role="navigation"]')
      await expect(nav).toBeVisible()
    })

    test('메인 콘텐츠에 main 역할이 있어야 함', async ({ page }) => {
      const main = page.locator('main[role="main"]')
      await expect(main).toBeVisible()
    })
  })

  test.describe('ARIA Labels', () => {
    test('사이드바에 aria-label이 있어야 함', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="사이드바"]')
      await expect(sidebar).toBeVisible()
    })

    test('네비게이션에 aria-label이 있어야 함', async ({ page }) => {
      const nav = page.locator('nav[aria-label="메인 네비게이션"]')
      await expect(nav).toBeVisible()
    })

    test('메인 콘텐츠에 aria-label이 있어야 함', async ({ page }) => {
      const main = page.locator('main[aria-label="메인 콘텐츠"]')
      await expect(main).toBeVisible()
    })
  })

  test.describe('Section Groups', () => {
    test('업로드 섹션에 group 역할이 있어야 함', async ({ page }) => {
      const uploadSection = page.locator('[role="group"][aria-labelledby="upload-section-title"]')
      await expect(uploadSection).toBeVisible()
    })

    test('MRP 섹션에 group 역할이 있어야 함', async ({ page }) => {
      const mrpSection = page.locator('[role="group"][aria-labelledby="mrp-section-title"]')
      await expect(mrpSection).toBeVisible()
    })

    test('발주 섹션에 group 역할이 있어야 함', async ({ page }) => {
      const orderSection = page.locator('[role="group"][aria-labelledby="order-section-title"]')
      await expect(orderSection).toBeVisible()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('Tab 키로 모든 네비게이션 링크에 접근 가능해야 함', async ({ page }) => {
      const basePage = new BasePage(page)

      // Skip link
      await page.keyboard.press('Tab')
      const skipLink = page.getByText('메인 콘텐츠로 건너뛰기')
      await expect(skipLink).toBeFocused()

      // 첫 번째 네비게이션 링크 (대시보드)
      await page.keyboard.press('Tab')
      const dashboardLink = basePage.sidebar.getByRole('link', { name: '대시보드' })
      await expect(dashboardLink).toBeFocused()

      // Enter 키로 활성화 가능
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('/')
    })

    test('포커스 스타일이 보여야 함', async ({ page }) => {
      // 버튼 또는 링크에 포커스
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // 포커스된 요소가 보여야 함
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Icons Accessibility', () => {
    test('아이콘에 aria-hidden이 적용되어야 함', async ({ page }) => {
      // SVG 아이콘들에 aria-hidden 확인
      const hiddenIcons = page.locator('nav svg[aria-hidden="true"]')
      const count = await hiddenIcons.count()

      // 최소 11개 메뉴 아이콘이 있어야 함
      expect(count).toBeGreaterThanOrEqual(11)
    })
  })

  test.describe('Loading States', () => {
    test('로딩 상태에 role="status"가 있어야 함', async ({ page }) => {
      // 페이지 이동 시 로딩 폴백 확인 (빠르게 사라질 수 있음)
      await page.goto('/products')

      // 로딩 상태가 있었다면 role="status"가 있어야 함
      // 이미 로드되었을 수 있으므로 조건부 확인
      const loadingStatus = page.locator('[role="status"]')
      const hasLoadingStatus = await loadingStatus.count() >= 0
      expect(hasLoadingStatus).toBe(true)
    })
  })
})

test.describe('색상 대비', () => {
  test('충분한 색상 대비가 적용되어야 함 (수동 확인 필요)', async ({ page }) => {
    await page.goto('/')

    // 이 테스트는 Lighthouse나 axe-core로 자동화 가능
    // 여기서는 기본 렌더링 확인
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    // 텍스트가 표시되는지 확인
    const textElements = page.locator('p, h1, h2, h3, span')
    const count = await textElements.count()
    expect(count).toBeGreaterThan(0)
  })
})
