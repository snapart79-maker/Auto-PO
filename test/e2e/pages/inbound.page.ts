/**
 * Inbound/Outbound Page Object
 * 입고/출고 현황 페이지
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class InboundPage extends BasePage {
  // 테이블
  readonly dataTable: Locator

  // 조회조건
  readonly startDateInput: Locator
  readonly endDateInput: Locator
  readonly productCodeInput: Locator
  readonly partnerInput: Locator
  readonly searchButton: Locator
  readonly resetButton: Locator

  // 기능 버튼
  readonly addButton: Locator
  readonly uploadButton: Locator
  readonly downloadButton: Locator

  // 사이드 요약
  readonly summaryPanel: Locator

  constructor(page: Page) {
    super(page)
    this.dataTable = page.locator('table')

    this.startDateInput = page.locator('input[type="date"]').first()
    this.endDateInput = page.locator('input[type="date"]').nth(1)
    this.productCodeInput = page.getByPlaceholder(/품번/i)
    this.partnerInput = page.getByPlaceholder(/거래처/i)
    this.searchButton = page.getByRole('button', { name: /조회/i })
    this.resetButton = page.getByRole('button', { name: /초기화/i })

    this.addButton = page.getByRole('button', { name: /개별.*등록|등록/i })
    this.uploadButton = page.getByRole('button', { name: /업로드/i })
    this.downloadButton = page.getByRole('button', { name: /다운로드/i })

    this.summaryPanel = page.locator('aside, [class*="summary"]').first()
  }

  /**
   * 입고 현황 페이지로 이동
   */
  async gotoInbound() {
    await this.goto('/inventory/inbound')
  }

  /**
   * 출고 현황 페이지로 이동
   */
  async gotoOutbound() {
    await this.goto('/inventory/outbound')
  }

  /**
   * 기간 설정
   */
  async setDateRange(startDate: string, endDate: string) {
    await this.startDateInput.fill(startDate)
    await this.endDateInput.fill(endDate)
  }

  /**
   * 검색 실행
   */
  async search() {
    await this.searchButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 조회조건 초기화
   */
  async reset() {
    await this.resetButton.click()
  }

  /**
   * 테이블 행 수
   */
  async getRowCount(): Promise<number> {
    const rows = this.dataTable.locator('tbody tr')
    return await rows.count()
  }

  /**
   * 사이드 요약 패널 확인
   */
  async hasSummaryPanel(): Promise<boolean> {
    return await this.summaryPanel.isVisible()
  }

  /**
   * 거래처별 합계 확인
   */
  async getPartnerSummary(): Promise<Locator> {
    return this.summaryPanel.locator('[class*="summary-item"], tr, .partner-summary')
  }
}
