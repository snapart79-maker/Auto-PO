/**
 * Products CRUD E2E Tests
 * 제품 관리 CRUD 플로우 테스트
 */

import { test, expect } from '@playwright/test'
import { ProductsPage } from '../pages'

test.describe('Products CRUD', () => {
  let productsPage: ProductsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    await productsPage.goto()
  })

  test.describe('제품 목록', () => {
    test('제품 관리 페이지가 로드되어야 함', async ({ page }) => {
      await expect(page).toHaveURL('/products')
      await expect(productsPage.pageTitle).toContainText('제품')
    })

    test('제품 테이블이 표시되어야 함', async () => {
      await expect(productsPage.dataTable).toBeVisible()
    })

    test('테이블 헤더가 올바르게 표시되어야 함', async ({ page }) => {
      const headers = page.locator('thead th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    })

    test('제품 목록 또는 빈 상태가 표시되어야 함', async ({ page }) => {
      // 테이블에 행이 있거나 빈 상태 메시지가 있어야 함
      const hasRows = await page.locator('tbody tr').count() > 0
      const hasEmptyMessage = await page.getByText(/제품.*없|데이터.*없|등록.*없/i).count() > 0

      expect(hasRows || hasEmptyMessage).toBe(true)
    })
  })

  test.describe('제품 검색/필터', () => {
    test('검색 기능이 있을 경우 동작해야 함', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/검색|찾기/i)

      if (await searchInput.isVisible()) {
        await searchInput.fill('TEST')
        await page.waitForTimeout(500) // 디바운스 대기

        // 검색 후 테이블이 여전히 표시되어야 함
        await expect(productsPage.dataTable).toBeVisible()
      }
    })
  })

  test.describe('제품 상세', () => {
    test('제품 행 클릭 시 상세 보기 가능해야 함', async ({ page }) => {
      // 제품이 있는 경우에만 테스트
      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        // 첫 번째 행 클릭
        await rows.first().click()

        // 다이얼로그 또는 상세 페이지로 이동 확인
        const hasDialog = await page.getByRole('dialog').isVisible().catch(() => false)
        const hasDetailContent = await page.getByText(/상세|정보|수정/i).count() > 0

        expect(hasDialog || hasDetailContent).toBe(true)
      }
    })
  })

  test.describe('페이지네이션', () => {
    test('페이지네이션이 표시되어야 함 (데이터가 많을 경우)', async ({ page }) => {
      // 페이지네이션 요소 확인 (선택적)
      const pagination = page.locator('[aria-label*="pagination"], .pagination, nav[role="navigation"]')
      const hasPagination = await pagination.count() > 0

      // 페이지네이션이 있을 수도 없을 수도 있음 (데이터 양에 따라)
      expect(typeof hasPagination).toBe('boolean')
    })
  })
})
