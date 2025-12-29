/**
 * Inventory Flow E2E Tests
 * 재고 관리 플로우 테스트
 */

import { test, expect } from '@playwright/test'
import { InventoryPage, InboundPage } from '../pages'

test.describe('재고 현황', () => {
  let inventoryPage: InventoryPage

  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPage(page)
    await inventoryPage.gotoStatus()
  })

  test('재고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/status')
    await expect(inventoryPage.pageTitle).toContainText(/재고/)
  })

  test('재고 테이블이 표시되어야 함', async () => {
    await expect(inventoryPage.statusTable).toBeVisible()
  })

  test('조회 버튼이 있어야 함', async () => {
    await expect(inventoryPage.searchButton).toBeVisible()
  })

  test('재고 상태 필터가 있어야 함', async ({ page }) => {
    const filter = page.locator('[role="combobox"], select').first()
    await expect(filter).toBeVisible()
  })

  test('테이블 헤더에 필수 컬럼이 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const joinedHeaders = headerTexts.join(' ')

    expect(joinedHeaders).toMatch(/품번|품명|재고|상태/i)
  })

  test('테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').count() > 0
    const hasEmptyMessage = await page.getByText(/데이터.*없|재고.*없/i).count() > 0

    expect(hasRows || hasEmptyMessage).toBe(true)
  })
})

test.describe('초기 재고 등록', () => {
  let inventoryPage: InventoryPage

  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPage(page)
    await inventoryPage.gotoInitial()
  })

  test('초기 재고 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/initial')
    await expect(inventoryPage.pageTitle).toContainText(/초기.*재고/i)
  })

  test('등록 버튼이 있어야 함', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /등록/i })
    await expect(addButton).toBeVisible()
  })

  test('테이블이 표시되어야 함', async ({ page }) => {
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })
})

test.describe('재고 조정', () => {
  let inventoryPage: InventoryPage

  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPage(page)
    await inventoryPage.gotoAdjustment()
  })

  test('재고 조정 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/adjustment')
    await expect(inventoryPage.pageTitle).toContainText(/재고.*조정/i)
  })

  test('조정 등록 버튼이 있어야 함', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /등록|조정/i })
    await expect(addButton).toBeVisible()
  })

  test('조정 이력 테이블이 표시되어야 함', async ({ page }) => {
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('테이블 헤더에 조정 관련 컬럼이 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const joinedHeaders = headerTexts.join(' ')

    expect(joinedHeaders).toMatch(/조정|유형|수량|사유/i)
  })
})

test.describe('입고 현황', () => {
  let inboundPage: InboundPage

  test.beforeEach(async ({ page }) => {
    inboundPage = new InboundPage(page)
    await inboundPage.gotoInbound()
  })

  test('입고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/inbound')
    await expect(inboundPage.pageTitle).toContainText(/입고/)
  })

  test('입고 테이블이 표시되어야 함', async () => {
    await expect(inboundPage.dataTable).toBeVisible()
  })

  test('조회 버튼이 있어야 함', async () => {
    await expect(inboundPage.searchButton).toBeVisible()
  })

  test('기간 조회조건이 있어야 함', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]')
    const count = await dateInputs.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('테이블 헤더에 필수 컬럼이 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const joinedHeaders = headerTexts.join(' ')

    expect(joinedHeaders).toMatch(/입고일|거래처|품번|수량/i)
  })
})

test.describe('출고 현황', () => {
  let inboundPage: InboundPage

  test.beforeEach(async ({ page }) => {
    inboundPage = new InboundPage(page)
    await inboundPage.gotoOutbound()
  })

  test('출고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/outbound')
    await expect(inboundPage.pageTitle).toContainText(/출고/)
  })

  test('출고 테이블이 표시되어야 함', async () => {
    await expect(inboundPage.dataTable).toBeVisible()
  })

  test('테이블 헤더에 필수 컬럼이 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const joinedHeaders = headerTexts.join(' ')

    expect(joinedHeaders).toMatch(/출고일|출하일|거래처|품번|수량/i)
  })
})
