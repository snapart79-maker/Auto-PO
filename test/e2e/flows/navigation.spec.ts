/**
 * Navigation E2E Tests
 * 모든 페이지 네비게이션 테스트
 */

import { test, expect } from '@playwright/test'
import { BasePage } from '../pages'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('사이드바가 표시되어야 함', async ({ page }) => {
    const basePage = new BasePage(page)
    await expect(basePage.sidebar).toBeVisible()
  })

  test('Auto PO 타이틀이 표시되어야 함', async ({ page }) => {
    const title = page.locator('h1', { hasText: 'Auto PO' })
    await expect(title).toBeVisible()
  })

  test.describe('페이지 네비게이션', () => {
    const pages = [
      { path: '/', label: '대시보드', expectedText: '대시보드' },
      { path: '/company', label: '회사정보', expectedText: '회사' },
      { path: '/vehicle-models', label: '차종관리', expectedText: '차종' },
      { path: '/partners', label: '거래처관리', expectedText: '거래처' },
      { path: '/products', label: '제품관리', expectedText: '제품' },
      { path: '/exchange-rates', label: '환율관리', expectedText: '환율' },
      { path: '/upload/inventory', label: '입출고 업로드', expectedText: '입출고' },
      { path: '/upload/shipment', label: '출고계획 업로드', expectedText: '출고' },
      { path: '/mrp', label: 'MRP 계산', expectedText: 'MRP' },
      { path: '/mrp/vietnam', label: '베트남 발주', expectedText: '베트남' },
      { path: '/orders', label: '발주관리', expectedText: '발주' },
    ]

    for (const { path, label, expectedText } of pages) {
      test(`${label} 페이지로 이동 가능해야 함`, async ({ page }) => {
        const basePage = new BasePage(page)

        // URL로 직접 이동
        await basePage.goto(path)

        // 페이지가 로드되었는지 확인
        await expect(page).toHaveURL(path)

        // 메인 콘텐츠가 표시되는지 확인
        await expect(basePage.mainContent).toBeVisible()

        // 페이지 관련 텍스트가 있는지 확인
        const pageContent = await basePage.mainContent.textContent()
        expect(pageContent).toContain(expectedText)
      })
    }
  })

  test.describe('사이드바 네비게이션', () => {
    test('대시보드 링크 클릭시 대시보드로 이동', async ({ page }) => {
      const basePage = new BasePage(page)

      // 다른 페이지로 먼저 이동
      await basePage.goto('/products')

      // 대시보드 클릭
      await basePage.navigateTo('대시보드')

      // URL 확인
      await expect(page).toHaveURL('/')
    })

    test('제품관리 링크 클릭시 제품 페이지로 이동', async ({ page }) => {
      const basePage = new BasePage(page)

      await basePage.navigateTo('제품관리')

      await expect(page).toHaveURL('/products')
    })

    test('발주관리 링크 클릭시 발주 페이지로 이동', async ({ page }) => {
      const basePage = new BasePage(page)

      await basePage.navigateTo('발주관리')

      await expect(page).toHaveURL('/orders')
    })
  })

  test('활성 링크 스타일이 적용되어야 함', async ({ page }) => {
    const basePage = new BasePage(page)

    // 대시보드 링크가 활성 상태인지 확인
    const dashboardLink = basePage.sidebar.getByRole('link', { name: '대시보드' })
    await expect(dashboardLink).toHaveClass(/bg-primary/)

    // 다른 페이지로 이동
    await basePage.navigateTo('제품관리')

    // 제품관리 링크가 활성 상태로 변경
    const productsLink = basePage.sidebar.getByRole('link', { name: '제품관리' })
    await expect(productsLink).toHaveClass(/bg-primary/)

    // 대시보드 링크는 비활성 상태
    await expect(dashboardLink).not.toHaveClass(/bg-primary/)
  })
})
