/**
 * Dashboard Page Object
 * 대시보드 페이지 전용 객체
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class DashboardPage extends BasePage {
  readonly statCards: Locator
  readonly recentOrdersWidget: Locator
  readonly mrpSummaryWidget: Locator
  readonly orderStatusChart: Locator
  readonly inventoryChart: Locator
  readonly refreshButton: Locator

  constructor(page: Page) {
    super(page)
    this.statCards = page.locator('[data-testid="stat-card"]')
    this.recentOrdersWidget = page.locator('[data-testid="recent-orders-widget"]')
    this.mrpSummaryWidget = page.locator('[data-testid="mrp-summary-widget"]')
    this.orderStatusChart = page.locator('[data-testid="order-status-chart"]')
    this.inventoryChart = page.locator('[data-testid="inventory-chart"]')
    this.refreshButton = page.getByRole('button', { name: '새로고침' })
  }

  /**
   * 대시보드 페이지로 이동
   */
  async goto() {
    await super.goto('/')
  }

  /**
   * StatCard 수 가져오기
   */
  async getStatCardCount(): Promise<number> {
    // data-testid가 없으면 Card 컴포넌트 개수로 대체
    const cards = this.page.locator('main').locator('.rounded-lg.border.bg-card')
    return await cards.count()
  }

  /**
   * 특정 StatCard 텍스트 가져오기
   */
  async getStatCardValue(index: number): Promise<string> {
    const cards = this.page.locator('main').locator('.rounded-lg.border.bg-card')
    const card = cards.nth(index)
    const value = card.locator('.text-2xl, .text-3xl').first()
    return await value.textContent() ?? ''
  }

  /**
   * 새로고침 버튼 클릭
   */
  async clickRefresh() {
    await this.refreshButton.click()
  }

  /**
   * 차트 로딩 대기
   */
  async waitForChartsLoad() {
    // recharts 컨테이너 대기
    await this.page.waitForSelector('.recharts-wrapper', { timeout: 10000 }).catch(() => {
      // 차트가 없을 수도 있음 (데이터 없음 상태)
    })
  }

  /**
   * 대시보드 완전 로딩 확인
   */
  async isFullyLoaded(): Promise<boolean> {
    try {
      await this.pageTitle.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}
