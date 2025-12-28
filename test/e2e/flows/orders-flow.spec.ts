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
  })

  test.describe('발주 목록', () => {
    test('발주 관리 페이지가 로드되어야 함', async ({ page }) => {
      await expect(page).toHaveURL('/orders')
      await expect(ordersPage.pageTitle).toContainText('발주')
    })

    test('발주 테이블이 표시되어야 함', async () => {
      await expect(ordersPage.dataTable).toBeVisible()
    })

    test('테이블 헤더에 상태 컬럼이 있어야 함', async ({ page }) => {
      const statusHeader = page.locator('thead').getByText(/상태/i)
      await expect(statusHeader).toBeVisible()
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
    await expect(page).toHaveURL('/mrp')

    const title = page.locator('h1, h2').first()
    await expect(title).toContainText('MRP')
  })

  test('베트남 발주 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/mrp/vietnam')
    await expect(page).toHaveURL('/mrp/vietnam')

    const title = page.locator('h1, h2').first()
    await expect(title).toContainText('베트남')
  })
})

test.describe('업로드 페이지', () => {
  test('입출고 업로드 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/upload/inventory')
    await expect(page).toHaveURL('/upload/inventory')

    // 업로드 관련 요소 확인
    const uploadArea = page.getByText(/업로드|드래그|파일/i)
    await expect(uploadArea.first()).toBeVisible()
  })

  test('출고계획 업로드 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto('/upload/shipment')
    await expect(page).toHaveURL('/upload/shipment')

    const uploadArea = page.getByText(/업로드|드래그|파일/i)
    await expect(uploadArea.first()).toBeVisible()
  })
})
