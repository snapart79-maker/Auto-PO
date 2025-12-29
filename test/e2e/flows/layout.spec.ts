/**
 * Layout E2E Tests
 * 레이아웃 구조 및 반응형 테스트
 */

import { test, expect } from '@playwright/test'
import { BasePage } from '../pages'

test.describe('Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('기본 레이아웃 구조가 올바르게 렌더링되어야 함', async ({ page }) => {
    // 사이드바
    await expect(page.locator('aside')).toBeVisible()

    // 메인 콘텐츠
    await expect(page.locator('main')).toBeVisible()
  })

  test('사이드바에 메뉴가 표시되어야 함', async ({ page }) => {
    const sidebar = page.locator('aside')

    // 사이드바가 표시되어야 함
    await expect(sidebar).toBeVisible()

    // 대시보드 버튼 또는 링크 확인
    const dashboardBtn = sidebar.getByRole('button', { name: '대시보드' })
    const dashboardLink = sidebar.getByRole('link', { name: '대시보드' })
    const hasDashboard = (await dashboardBtn.count() > 0) || (await dashboardLink.count() > 0)
    expect(hasDashboard).toBe(true)

    // 네비게이션에 링크나 버튼이 있어야 함
    const links = sidebar.locator('a')
    const buttons = sidebar.locator('button')
    const count = await links.count() + await buttons.count()
    expect(count).toBeGreaterThan(1)
  })

  test('메인 콘텐츠 영역이 스크롤 가능해야 함', async ({ page }) => {
    const basePage = new BasePage(page)

    // 메인 콘텐츠에 overflow-auto 클래스가 있는지 확인
    await expect(basePage.mainContent).toHaveClass(/overflow-auto/)
  })

  test('페이지 배경색이 올바르게 적용되어야 함', async ({ page }) => {
    const container = page.locator('.bg-background').first()
    await expect(container).toBeVisible()
  })

  test.describe('섹션 헤더', () => {
    test('네비게이션에 그룹 헤더가 있어야 함', async ({ page }) => {
      const sidebar = page.locator('aside')
      // 버튼들이 있어야 함 (그룹 헤더)
      const buttons = sidebar.locator('button')
      const count = await buttons.count()
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('네비게이션에 텍스트가 있어야 함', async ({ page }) => {
      const sidebar = page.locator('aside')
      const text = await sidebar.textContent()
      expect(text?.length).toBeGreaterThan(0)
    })

    test('네비게이션 또는 사이드바에 메뉴가 있어야 함', async ({ page }) => {
      const nav = page.locator('nav')
      const sidebar = page.locator('aside')
      const hasNav = await nav.count() > 0
      const hasSidebar = await sidebar.count() > 0
      expect(hasNav || hasSidebar).toBe(true)
    })
  })

  test('아이콘이 렌더링되어야 함', async ({ page }) => {
    const sidebar = page.locator('aside')

    // SVG 아이콘들이 있는지 확인
    const icons = sidebar.locator('svg')
    const iconCount = await icons.count()

    // 최소 1개 이상의 아이콘이 있어야 함
    expect(iconCount).toBeGreaterThanOrEqual(1)
  })
})
