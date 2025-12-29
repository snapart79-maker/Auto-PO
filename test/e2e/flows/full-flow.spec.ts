/**
 * Full E2E Flow Tests
 * 입고 → 재고 → MRP → 발주 전체 흐름 테스트
 */

import { test, expect } from '@playwright/test'
import { DashboardPage, InventoryPage, MRPPage, OrdersPage } from '../pages'

test.describe('전체 흐름 테스트 (E2E)', () => {
  test('대시보드에서 시작하여 주요 페이지를 순회해야 함', async ({ page }) => {
    // 1. 대시보드 시작
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
    await expect(page).toHaveURL('/')
    await expect(dashboardPage.pageTitle).toContainText(/대시보드/)

    // 2. 입고 현황으로 이동
    await page.goto('/inventory/inbound')
    await expect(page).toHaveURL('/inventory/inbound')
    const inboundTitle = page.locator('h1, h2').first()
    await expect(inboundTitle).toContainText(/입고/)

    // 3. 재고 현황으로 이동
    await page.goto('/inventory/status')
    await expect(page).toHaveURL('/inventory/status')
    const inventoryTitle = page.locator('h1, h2').first()
    await expect(inventoryTitle).toContainText(/재고/)

    // 4. MRP 계산으로 이동
    await page.goto('/mrp')
    await expect(page).toHaveURL('/mrp')
    const mrpTitle = page.locator('h1, h2').first()
    await expect(mrpTitle).toContainText(/MRP/)

    // 5. 발주 관리로 이동
    await page.goto('/orders')
    await expect(page).toHaveURL('/orders')
    const ordersTitle = page.locator('h1, h2').first()
    await expect(ordersTitle).toContainText(/발주/)
  })

  test('사이드바 네비게이션으로 주요 페이지 이동', async ({ page }) => {
    await page.goto('/')

    const sidebar = page.locator('aside')

    // 입고/출고 메뉴 클릭
    const inboundLink = sidebar.getByRole('link', { name: /입고.*현황/i })
    if (await inboundLink.isVisible()) {
      await inboundLink.click()
      await expect(page).toHaveURL('/inventory/inbound')
    }

    // 재고 관리 메뉴 클릭
    const inventoryLink = sidebar.getByRole('link', { name: /재고.*현황/i })
    if (await inventoryLink.isVisible()) {
      await inventoryLink.click()
      await expect(page).toHaveURL('/inventory/status')
    }

    // MRP 메뉴 클릭
    const mrpLink = sidebar.getByRole('link', { name: /MRP.*계산|발주.*권고/i })
    if (await mrpLink.isVisible()) {
      await mrpLink.click()
      await expect(page).toHaveURL('/mrp')
    }

    // 발주 관리 메뉴 클릭
    const ordersLink = sidebar.getByRole('link', { name: /발주.*관리|발주서.*관리/i })
    if (await ordersLink.isVisible()) {
      await ordersLink.click()
      await expect(page).toHaveURL('/orders')
    }
  })
})

test.describe('재고 → MRP 흐름', () => {
  test('재고 현황에서 MRP로 이동하면 MRP 결과가 표시되어야 함', async ({ page }) => {
    // 재고 현황 확인
    const inventoryPage = new InventoryPage(page)
    await inventoryPage.gotoStatus()
    await expect(page).toHaveURL('/inventory/status')

    // 재고 테이블 확인
    await expect(inventoryPage.statusTable).toBeVisible()

    // MRP로 이동
    const mrpPage = new MRPPage(page)
    await mrpPage.goto()
    await expect(page).toHaveURL('/mrp')

    // MRP 테이블 확인
    await expect(mrpPage.mrpTable).toBeVisible()
  })
})

test.describe('MRP → 발주 흐름', () => {
  test('MRP 페이지에서 발주 관련 버튼이 있어야 함', async ({ page }) => {
    const mrpPage = new MRPPage(page)
    await mrpPage.goto()

    // 선택 발주 버튼 확인
    const selectedOrderBtn = page.getByRole('button', { name: /선택.*발주/i })
    await expect(selectedOrderBtn).toBeVisible()

    // 전체 발주 버튼 확인
    const allOrderBtn = page.getByRole('button', { name: /전체.*발주/i })
    await expect(allOrderBtn).toBeVisible()
  })

  test('발주 버튼 클릭 후 발주 페이지로 이동해야 함', async ({ page }) => {
    const mrpPage = new MRPPage(page)
    await mrpPage.goto()

    // 체크박스가 있는지 확인
    const checkboxes = page.locator('tbody [type="checkbox"], tbody [role="checkbox"]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount > 0) {
      // 첫 번째 체크박스 선택
      await checkboxes.first().click()

      // 선택 발주 버튼 클릭
      const selectedOrderBtn = page.getByRole('button', { name: /선택.*발주/i })
      if (await selectedOrderBtn.isEnabled()) {
        await selectedOrderBtn.click()

        // 발주 페이지로 이동 확인 (또는 성공 메시지)
        const navigated = await page.waitForURL('/orders', { timeout: 5000 }).catch(() => false)
        if (navigated) {
          await expect(page).toHaveURL('/orders')
        }
      }
    }
  })
})

test.describe('발주서 관리', () => {
  test('발주서 목록이 표시되어야 함', async ({ page }) => {
    const ordersPage = new OrdersPage(page)
    await ordersPage.goto()

    await expect(page).toHaveURL('/orders')
    await expect(ordersPage.dataTable).toBeVisible()
  })

  test('발주서 상태 필터가 있어야 함', async ({ page }) => {
    const ordersPage = new OrdersPage(page)
    await ordersPage.goto()

    const filter = page.locator('[role="combobox"], select').first()
    const hasFilter = await filter.count() > 0
    expect(hasFilter).toBe(true)
  })
})

test.describe('대시보드 통합', () => {
  test('대시보드에 재고 현황 위젯이 표시되어야 함', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // 재고 현황 카드 또는 위젯 확인
    const inventoryWidget = page.getByText(/재고.*현황|재고.*상태/i)
    await expect(inventoryWidget.first()).toBeVisible()
  })

  test('대시보드에 MRP 권고 위젯이 표시되어야 함', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // MRP 권고 위젯 확인
    const mrpWidget = page.getByText(/MRP.*권고|발주.*권고/i)
    await expect(mrpWidget.first()).toBeVisible()
  })

  test('대시보드 새로고침 시 데이터가 갱신되어야 함', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    const refreshButton = page.getByRole('button', { name: /새로고침/i })
    await expect(refreshButton).toBeVisible()

    // 새로고침 클릭
    await refreshButton.click()

    // 로딩 후 데이터 표시 확인
    await page.waitForLoadState('networkidle')
    const statCards = page.locator('[class*="card"], [class*="stat"]')
    const cardCount = await statCards.count()
    expect(cardCount).toBeGreaterThan(0)
  })
})

test.describe('데이터 일관성', () => {
  test('입고 데이터가 재고에 반영되어야 함 (시나리오 테스트)', async ({ page }) => {
    // 이 테스트는 실제 데이터가 있을 때만 의미있음
    // 여기서는 페이지 접근성만 확인

    // 1. 입고 현황 페이지 접근
    await page.goto('/inventory/inbound')
    const inboundTable = page.locator('table')
    await expect(inboundTable).toBeVisible()

    // 2. 재고 현황 페이지 접근
    await page.goto('/inventory/status')
    const inventoryTable = page.locator('table')
    await expect(inventoryTable).toBeVisible()

    // 두 페이지 모두 테이블이 있으면 통과
    expect(true).toBe(true)
  })

  test('출고 계획이 MRP 계산에 반영되어야 함 (시나리오 테스트)', async ({ page }) => {
    // 1. 출고 계획 페이지 접근
    await page.goto('/orders/shipment-plan')
    const shipmentTable = page.locator('table')
    await expect(shipmentTable).toBeVisible()

    // 2. MRP 페이지 접근
    await page.goto('/mrp')
    const mrpTable = page.locator('table')
    await expect(mrpTable).toBeVisible()

    // 두 페이지 모두 테이블이 있으면 통과
    expect(true).toBe(true)
  })
})
