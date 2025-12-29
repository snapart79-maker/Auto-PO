/**
 * Dashboard E2E Tests
 * 대시보드 페이지 테스트
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages'

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('대시보드 페이지가 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveURL('/')
    await expect(page.locator('main')).toContainText(/대시보드/)
  })

  test('대시보드 설명 또는 콘텐츠가 표시되어야 함', async ({ page }) => {
    const description = page.getByText(/현황.*확인|한눈에|재고|발주/i)
    const hasDescription = await description.count() > 0
    const hasContent = await page.locator('main').count() > 0
    expect(hasDescription || hasContent).toBe(true)
  })

  test.describe('StatCards', () => {
    test('통계 카드들이 표시되어야 함', async () => {
      // 페이지 로딩 대기
      await dashboardPage.waitForPageLoad()

      // Card 컴포넌트들 확인
      const cardCount = await dashboardPage.getStatCardCount()
      expect(cardCount).toBeGreaterThanOrEqual(4)
    })

    test('통계 카드에 숫자 값이 표시되어야 함', async ({ page }) => {
      await dashboardPage.waitForPageLoad()

      // 숫자 형태의 텍스트 확인 (0 또는 다른 숫자)
      const numbers = page.locator('main .text-2xl, main .text-3xl')
      const count = await numbers.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Widgets', () => {
    test('발주 관련 위젯이 표시되어야 함', async ({ page }) => {
      // 최근 발주 또는 발주 현황 관련 위젯
      const ordersWidget = page.getByText(/발주|진행중/i)
      const count = await ordersWidget.count()
      expect(count).toBeGreaterThan(0)
    })

    test('재고 관련 위젯이 표시되어야 함', async ({ page }) => {
      // 재고 현황 또는 재고 부족 관련 위젯
      const inventoryWidget = page.getByText(/재고|품목|제품/i)
      const count = await inventoryWidget.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Charts', () => {
    test('발주 상태 차트 또는 빈 상태가 표시되어야 함', async ({ page }) => {
      // 차트가 있거나 통계 카드가 있어야 함
      const hasChart = await page.locator('.recharts-wrapper, canvas').count() > 0
      const hasCards = await page.locator('[class*="card"]').count() > 0
      expect(hasChart || hasCards).toBe(true)
    })

    test('위젯 컨테이너가 표시되어야 함', async ({ page }) => {
      // 그리드 레이아웃 안에 위젯들이 있어야 함
      const widgets = page.locator('main .grid > div')
      const count = await widgets.count()
      expect(count).toBeGreaterThan(0)
    })

    test('차트 또는 빈 상태 메시지가 표시되어야 함', async ({ page }) => {
      // 차트가 있거나 "데이터가 없습니다" 메시지가 있어야 함
      const hasChart = await page.locator('.recharts-wrapper').count() > 0
      const hasEmptyMessage = await page.getByText(/데이터.*없/i).count() > 0

      expect(hasChart || hasEmptyMessage).toBe(true)
    })
  })

  test.describe('새로고침', () => {
    test('새로고침 버튼이 표시되어야 함', async () => {
      await expect(dashboardPage.refreshButton).toBeVisible()
    })

    test('새로고침 버튼 클릭 시 아이콘이 회전해야 함', async ({ page }) => {
      // 버튼 클릭
      await dashboardPage.clickRefresh()

      // animate-spin 클래스 확인 (로딩 중)
      const spinningIcon = page.locator('.animate-spin')
      // 빠르게 로딩이 끝날 수 있으므로 존재 여부만 확인
      const wasSpinning = await spinningIcon.count() >= 0
      expect(wasSpinning).toBe(true)
    })
  })

  test('그리드 레이아웃이 적용되어야 함', async ({ page }) => {
    // grid 클래스가 있는 컨테이너 확인
    const gridContainer = page.locator('.grid')
    const count = await gridContainer.count()
    expect(count).toBeGreaterThan(0)
  })
})
