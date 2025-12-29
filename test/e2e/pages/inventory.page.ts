/**
 * Inventory Page Object
 * 재고 관리 페이지 (재고 현황, 초기 재고, 재고 조정)
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class InventoryPage extends BasePage {
  // 재고 현황
  readonly statusTable: Locator
  readonly stockStatusFilter: Locator
  readonly searchButton: Locator
  readonly resetButton: Locator

  // 조회조건
  readonly productCodeInput: Locator
  readonly productNameInput: Locator

  // 재고 상태 배지
  readonly normalBadge: Locator
  readonly cautionBadge: Locator
  readonly warningBadge: Locator
  readonly criticalBadge: Locator

  constructor(page: Page) {
    super(page)
    this.statusTable = page.locator('table')
    this.stockStatusFilter = page.locator('[role="combobox"]').first()
    this.searchButton = page.getByRole('button', { name: /조회/i })
    this.resetButton = page.getByRole('button', { name: /초기화/i })
    this.productCodeInput = page.getByPlaceholder(/품번/i)
    this.productNameInput = page.getByPlaceholder(/품명/i)

    this.normalBadge = page.locator('[class*="green"], .bg-green-100')
    this.cautionBadge = page.locator('[class*="yellow"], .bg-yellow-100')
    this.warningBadge = page.locator('[class*="orange"], .bg-orange-100')
    this.criticalBadge = page.locator('[class*="red"], .bg-red-100')
  }

  /**
   * 재고 현황 페이지로 이동
   */
  async gotoStatus() {
    await this.goto('/inventory/status')
  }

  /**
   * 초기 재고 페이지로 이동
   */
  async gotoInitial() {
    await this.goto('/inventory/initial')
  }

  /**
   * 재고 조정 페이지로 이동
   */
  async gotoAdjustment() {
    await this.goto('/inventory/adjustment')
  }

  /**
   * 품번으로 검색
   */
  async searchByProductCode(code: string) {
    await this.productCodeInput.fill(code)
    await this.searchButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 재고 상태로 필터
   */
  async filterByStatus(status: 'ALL' | 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL') {
    await this.stockStatusFilter.click()
    const statusLabels: Record<string, string> = {
      ALL: '전체',
      NORMAL: '정상',
      CAUTION: '주의',
      WARNING: '경고',
      CRITICAL: '위험',
    }
    await this.page.getByRole('option', { name: statusLabels[status] }).click()
    await this.waitForPageLoad()
  }

  /**
   * 테이블 행 수 가져오기
   */
  async getInventoryRowCount(): Promise<number> {
    const rows = this.statusTable.locator('tbody tr')
    return await rows.count()
  }

  /**
   * 사이드 요약 패널 확인
   */
  async getSummaryPanel(): Promise<Locator> {
    return this.page.locator('[class*="summary"], aside, .side-panel').first()
  }
}
