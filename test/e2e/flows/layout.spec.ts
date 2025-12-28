/**
 * Layout E2E Tests
 * 레이아웃 구조 및 반응형 테스트
 */

import { test, expect } from '@playwright/test'
import { BasePage } from '../pages'

test.describe('Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('기본 레이아웃 구조가 올바르게 렌더링되어야 함', async ({ page }) => {
    const basePage = new BasePage(page)

    // 사이드바
    await expect(basePage.sidebar).toBeVisible()

    // 메인 콘텐츠
    await expect(basePage.mainContent).toBeVisible()

    // 사이드바 너비 확인 (w-64 = 256px)
    const sidebarBox = await basePage.sidebar.boundingBox()
    expect(sidebarBox?.width).toBeCloseTo(256, 5)
  })

  test('사이드바에 모든 메뉴 그룹이 표시되어야 함', async ({ page }) => {
    const sidebar = page.locator('aside')

    // 기본 메뉴
    await expect(sidebar.getByRole('link', { name: '대시보드' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '회사정보' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '차종관리' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '거래처관리' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '제품관리' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '환율관리' })).toBeVisible()

    // 업로드 섹션
    await expect(sidebar.getByText('데이터 업로드')).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '입출고 업로드' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '출고계획 업로드' })).toBeVisible()

    // MRP 섹션
    await expect(sidebar.getByText('MRP 관리')).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'MRP 계산' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '베트남 발주' })).toBeVisible()

    // 발주 섹션
    await expect(sidebar.getByText('발주 관리')).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '발주관리' })).toBeVisible()
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
    test('데이터 업로드 섹션 헤더가 표시되어야 함', async ({ page }) => {
      const header = page.getByText('데이터 업로드')
      await expect(header).toBeVisible()
    })

    test('MRP 관리 섹션 헤더가 표시되어야 함', async ({ page }) => {
      const header = page.getByText('MRP 관리')
      await expect(header).toBeVisible()
    })

    test('발주 관리 섹션 헤더가 표시되어야 함', async ({ page }) => {
      const header = page.locator('aside').getByText('발주 관리')
      await expect(header).toBeVisible()
    })
  })

  test('루시드 아이콘이 렌더링되어야 함', async ({ page }) => {
    const sidebar = page.locator('aside')

    // SVG 아이콘들이 있는지 확인
    const icons = sidebar.locator('svg')
    const iconCount = await icons.count()

    // 최소 10개 이상의 아이콘이 있어야 함 (11개 메뉴 + 섹션 헤더)
    expect(iconCount).toBeGreaterThanOrEqual(10)
  })
})
