/**
 * Orders Flow E2E Tests
 * 발주 관리 플로우 테스트
 */

import { test, expect } from '@playwright/test'
import { OrdersPage } from '../pages'

test.describe('Orders Flow', () => {
  let ordersPage: OrdersPage

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page)
    await ordersPage.goto()
    await page.waitForLoadState('networkidle')
  })

  test.describe('발주 목록', () => {
    test('발주 관리 페이지가 로드되어야 함', async ({ page }) => {
      await expect(page).toHaveURL('/orders')
      // 발주 관리 페이지에 콘텐츠가 있어야 함 (테이블 또는 빈 상태)
      const hasTable = await page.locator('table').count() > 0
      const hasEmptyState = await page.getByText(/발주.*없|등록된.*없/i).count() > 0
      expect(hasTable || hasEmptyState).toBe(true)
    })

    test('발주 테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
      const hasTable = await page.locator('table').count() > 0
      const hasEmptyState = await page.getByText(/발주.*없|등록된.*없/i).count() > 0
      expect(hasTable || hasEmptyState).toBe(true)
    })

    test('테이블 헤더가 있거나 빈 상태가 표시되어야 함', async ({ page }) => {
      const headers = page.locator('thead th')
      const headerCount = await headers.count()
      const hasEmptyState = await page.getByText(/발주.*없|등록된.*없/i).count() > 0
      expect(headerCount > 0 || hasEmptyState).toBe(true)
    })

    test('발주 목록 또는 빈 상태가 표시되어야 함', async ({ page }) => {
      const hasRows = await page.locator('tbody tr').count() > 0
      const hasEmptyMessage = await page.getByText(/발주.*없|데이터.*없/i).count() > 0

      expect(hasRows || hasEmptyMessage).toBe(true)
    })
  })

  test.describe('발주 상태 필터', () => {
    test('상태 필터가 표시되어야 함', async ({ page }) => {
      // 콤보박스 또는 Select 확인
      const filter = page.locator('[role="combobox"], select').first()
      const hasFilter = await filter.count() > 0
      expect(hasFilter).toBe(true)
    })
  })

  test.describe('발주 상세', () => {
    test('발주 행 클릭 시 상세 다이얼로그가 열려야 함', async ({ page }) => {
      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        // 첫 번째 행의 버튼 또는 링크 클릭
        const viewButton = rows.first().getByRole('button').first()
        if (await viewButton.isVisible()) {
          await viewButton.click()

          // 다이얼로그 확인
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible({ timeout: 5000 })

          // 다이얼로그 닫기
          await ordersPage.closeDialog()
        }
      }
    })
  })

  test.describe('발주 상태 뱃지', () => {
    test('발주 상태가 뱃지로 표시되어야 함', async ({ page }) => {
      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        // 상태 뱃지 확인 (Badge 컴포넌트 사용)
        const badge = rows.first().locator('.inline-flex, [class*="badge"]').first()
        const hasBadge = await badge.count() > 0
        expect(hasBadge).toBe(true)
      }
    })
  })
})

test.describe('MRP 페이지', () => {
  test('MRP 계산 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/mrp')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/mrp')

    // MRP 관련 콘텐츠가 있어야 함
    await expect(page.locator('main')).toContainText(/MRP/)
  })

  test('베트남 발주 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/mrp/vietnam')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/mrp/vietnam')

    // 베트남 관련 콘텐츠가 있어야 함
    await expect(page.locator('main')).toContainText(/베트남/)
  })
})

test.describe('입고/출고 페이지', () => {
  test('입고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/inbound')
    await expect(page).toHaveURL('/inbound')
    await page.waitForLoadState('networkidle')

    // 입고 관련 콘텐츠 확인 (테이블이 로드될 때까지 대기)
    await expect(page.locator('main')).toContainText(/입고|조회|거래처/)
  })

  test('출고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/outbound')
    await expect(page).toHaveURL('/outbound')
    await page.waitForLoadState('networkidle')

    // 출고 관련 콘텐츠 확인
    await expect(page.locator('main')).toContainText(/출고|조회|거래처/)
  })
})
