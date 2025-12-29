/**
 * MRP Flow E2E Tests
 * MRP 계산 / 발주 권고 플로우 테스트
 */

import { test, expect } from '@playwright/test'
import { MRPPage, ShipmentPlanPage } from '../pages'

test.describe('MRP 계산 / 발주 권고', () => {
  let mrpPage: MRPPage

  test.beforeEach(async ({ page }) => {
    mrpPage = new MRPPage(page)
    await mrpPage.goto()
  })

  test('MRP 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/mrp')
    await expect(mrpPage.pageTitle).toContainText(/MRP/)
  })

  test('MRP 테이블이 표시되어야 함', async () => {
    await expect(mrpPage.mrpTable).toBeVisible()
  })

  test('MRP 계산 버튼이 있어야 함', async ({ page }) => {
    const calcButton = page.getByRole('button', { name: /MRP.*계산|재계산/i })
    await expect(calcButton).toBeVisible()
  })

  test('테이블 헤더에 필수 컬럼이 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const joinedHeaders = headerTexts.join(' ')

    // 최소 필수 컬럼 확인
    expect(joinedHeaders).toMatch(/품번|품명|현재고|재고|발주|권고/i)
  })

  test('체크박스가 있어야 함', async ({ page }) => {
    const checkboxes = page.locator('[type="checkbox"], [role="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('MRP 발주 버튼', () => {
  let mrpPage: MRPPage

  test.beforeEach(async ({ page }) => {
    mrpPage = new MRPPage(page)
    await mrpPage.goto()
  })

  test('선택 발주 버튼이 있어야 함', async ({ page }) => {
    const selectedOrderBtn = page.getByRole('button', { name: /선택.*발주/i })
    await expect(selectedOrderBtn).toBeVisible()
  })

  test('전체 발주 버튼이 있어야 함', async ({ page }) => {
    const allOrderBtn = page.getByRole('button', { name: /전체.*발주/i })
    await expect(allOrderBtn).toBeVisible()
  })

  test('선택된 항목 없으면 선택 발주 버튼이 비활성화되거나 경고해야 함', async ({ page }) => {
    const selectedOrderBtn = page.getByRole('button', { name: /선택.*발주/i })

    // 버튼이 disabled이거나 클릭해도 아무 일도 안 일어나야 함
    const isDisabled = await selectedOrderBtn.isDisabled()
    if (!isDisabled) {
      await selectedOrderBtn.click()
      // 토스트 경고 또는 현재 페이지 유지 확인
      await expect(page).toHaveURL('/mrp')
    } else {
      expect(isDisabled).toBe(true)
    }
  })
})

test.describe('MRP 자동 계산', () => {
  test('화면 진입 시 자동으로 MRP가 계산되어야 함', async ({ page }) => {
    const mrpPage = new MRPPage(page)
    await mrpPage.goto()

    // 테이블에 데이터가 있거나 빈 상태 메시지가 있어야 함
    await page.waitForLoadState('networkidle')

    const hasRows = await page.locator('tbody tr').count() > 0
    const hasEmptyMessage = await page.getByText(/데이터.*없|결과.*없|품목.*없/i).count() > 0

    expect(hasRows || hasEmptyMessage).toBe(true)
  })
})

test.describe('베트남 주간 발주', () => {
  let mrpPage: MRPPage

  test.beforeEach(async ({ page }) => {
    mrpPage = new MRPPage(page)
    await mrpPage.gotoVietnam()
  })

  test('베트남 발주 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/mrp/vietnam')
    await expect(mrpPage.pageTitle).toContainText(/베트남/)
  })

  test('베트남 발주 테이블이 표시되어야 함', async () => {
    await expect(mrpPage.dataTable).toBeVisible()
  })

  test('주간 발주 관련 요소가 있어야 함', async ({ page }) => {
    // 선적일 선택, 통합 발주 등
    const hasShipmentDate = await page.getByText(/선적|예정/i).count() > 0
    const hasWeeklyOrder = await page.getByRole('button').count() > 0

    expect(hasShipmentDate || hasWeeklyOrder).toBe(true)
  })
})

test.describe('출고 계획 등록', () => {
  let shipmentPlanPage: ShipmentPlanPage

  test.beforeEach(async ({ page }) => {
    shipmentPlanPage = new ShipmentPlanPage(page)
    await shipmentPlanPage.goto()
  })

  test('출고 계획 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/orders/shipment-plan')
    await expect(shipmentPlanPage.pageTitle).toContainText(/출고.*계획/i)
  })

  test('출고 계획 테이블이 표시되어야 함', async () => {
    await expect(shipmentPlanPage.dataTable).toBeVisible()
  })

  test('개별 등록 버튼이 있어야 함', async () => {
    await expect(shipmentPlanPage.addButton).toBeVisible()
  })

  test('개별 등록 다이얼로그가 열려야 함', async ({ page }) => {
    await shipmentPlanPage.addButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // 다이얼로그 닫기
    await page.keyboard.press('Escape')
  })

  test('조회 버튼이 있어야 함', async () => {
    await expect(shipmentPlanPage.searchButton).toBeVisible()
  })

  test('사이드 요약 패널이 있어야 함', async () => {
    await expect(shipmentPlanPage.summaryPanel).toBeVisible()
  })
})
