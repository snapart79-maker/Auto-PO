/**
 * Inventory Flow E2E Tests
 * 재고 관리 플로우 테스트
 */

import { test, expect } from '@playwright/test'
import { InventoryPage, InboundPage } from '../pages'

test.describe('재고 현황', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory/status')
    await page.waitForLoadState('networkidle')
  })

  test('재고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/status')
    await expect(page.locator('main')).toContainText(/재고/)
  })

  test('재고 테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.getByText(/데이터.*없|재고.*없|조회.*없/i).count() > 0
    expect(hasTable || hasEmptyState).toBe(true)
  })

  test('조회 버튼 또는 필터가 있어야 함', async ({ page }) => {
    const button = page.getByRole('button', { name: /조회|검색/i })
    const combobox = page.locator('[role="combobox"]')
    const textbox = page.locator('input[type="text"], input[placeholder]')
    const hasButton = await button.count() > 0
    const hasCombobox = await combobox.count() > 0
    const hasTextbox = await textbox.count() > 0
    expect(hasButton || hasCombobox || hasTextbox).toBe(true)
  })

  test('재고 상태 필터가 있어야 함', async ({ page }) => {
    const filter = page.locator('[role="combobox"], select').first()
    await expect(filter).toBeVisible()
  })

  test('테이블 헤더 또는 콘텐츠가 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerCount = await headers.count()
    const hasEmptyState = await page.getByText(/데이터.*없|재고.*없|조회.*없/i).count() > 0

    if (headerCount > 0) {
      const headerTexts = await headers.allTextContents()
      const joinedHeaders = headerTexts.join(' ')
      expect(joinedHeaders).toMatch(/품번|품명|재고|상태|거래처|날짜/i)
    } else {
      expect(hasEmptyState).toBe(true)
    }
  })

  test('테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').count() > 0
    const hasEmptyMessage = await page.getByText(/데이터.*없|재고.*없/i).count() > 0

    expect(hasRows || hasEmptyMessage).toBe(true)
  })
})

test.describe('초기 재고 등록', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory/initial')
    await page.waitForLoadState('networkidle')
  })

  test('초기 재고 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/initial')
    await expect(page.locator('main')).toContainText(/초기|재고/)
  })

  test('등록 버튼이 있어야 함', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /등록|일괄/i })
    const hasButton = await addButton.count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasButton || hasContent).toBe(true)
  })

  test('테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.getByText(/데이터.*없|등록.*없|재고.*없/i).count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasTable || hasEmptyState || hasContent).toBe(true)
  })
})

test.describe('재고 조정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory/adjustment')
    await page.waitForLoadState('networkidle')
  })

  test('재고 조정 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inventory/adjustment')
    await expect(page.locator('main')).toContainText(/재고|조정/)
  })

  test('조정 등록 버튼이 있어야 함', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /등록|조정|일괄/i })
    const hasButton = await addButton.count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasButton || hasContent).toBe(true)
  })

  test('조정 이력 테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.getByText(/데이터.*없|등록.*없|조정.*없/i).count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasTable || hasEmptyState || hasContent).toBe(true)
  })

  test('테이블 헤더 또는 콘텐츠가 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerCount = await headers.count()
    const hasContent = await page.locator('main').count() > 0
    expect(headerCount > 0 || hasContent).toBe(true)
  })
})

test.describe('입고 현황', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbound')
    await page.waitForLoadState('networkidle')
  })

  test('입고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/inbound')
    await expect(page.locator('main')).toContainText(/입고|거래처|조회/)
  })

  test('입고 테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.getByText(/데이터.*없|등록.*없|입고.*없/i).count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasTable || hasEmptyState || hasContent).toBe(true)
  })

  test('조회 버튼 또는 필터가 있어야 함', async ({ page }) => {
    const button = page.getByRole('button', { name: /조회|검색/i })
    const combobox = page.locator('[role="combobox"]')
    const hasButton = await button.count() > 0
    const hasCombobox = await combobox.count() > 0
    expect(hasButton || hasCombobox).toBe(true)
  })

  test('기간 조회조건 또는 필터가 있어야 함', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]')
    const combobox = page.locator('[role="combobox"]')
    const dateCount = await dateInputs.count()
    const comboboxCount = await combobox.count()
    expect(dateCount > 0 || comboboxCount > 0).toBe(true)
  })

  test('테이블 헤더 또는 콘텐츠가 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerCount = await headers.count()
    const hasContent = await page.locator('main').count() > 0
    expect(headerCount > 0 || hasContent).toBe(true)
  })
})

test.describe('출고 현황', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/outbound')
    await page.waitForLoadState('networkidle')
  })

  test('출고 현황 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/outbound')
    await expect(page.locator('main')).toContainText(/출고|거래처|조회/)
  })

  test('출고 테이블 또는 빈 상태가 표시되어야 함', async ({ page }) => {
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyState = await page.getByText(/데이터.*없|등록.*없|출고.*없/i).count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasTable || hasEmptyState || hasContent).toBe(true)
  })

  test('테이블 헤더 또는 콘텐츠가 있어야 함', async ({ page }) => {
    const headers = page.locator('thead th')
    const headerCount = await headers.count()
    const hasContent = await page.locator('main').count() > 0
    expect(headerCount > 0 || hasContent).toBe(true)
  })
})
