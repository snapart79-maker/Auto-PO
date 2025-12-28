/**
 * Orders Page Object
 * 발주 관리 페이지 전용 객체
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class OrdersPage extends BasePage {
  readonly createButton: Locator
  readonly dataTable: Locator
  readonly statusFilter: Locator
  readonly dateFilter: Locator
  readonly orderRows: Locator

  constructor(page: Page) {
    super(page)
    this.createButton = page.getByRole('button', { name: /생성|추가|새.*발주/i })
    this.dataTable = page.locator('table')
    this.statusFilter = page.locator('[data-testid="status-filter"]')
    this.dateFilter = page.locator('[data-testid="date-filter"]')
    this.orderRows = page.locator('tbody tr')
  }

  /**
   * 발주 관리 페이지로 이동
   */
  async goto() {
    await super.goto('/orders')
  }

  /**
   * 발주 목록 행 수 가져오기
   */
  async getOrderCount(): Promise<number> {
    return await this.getTableRowCount()
  }

  /**
   * 상태별 필터링
   */
  async filterByStatus(status: string) {
    const filterButton = this.page.getByRole('combobox').first()
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await this.page.getByRole('option', { name: status }).click()
    }
  }

  /**
   * 특정 발주 행 클릭
   */
  async clickOrderRow(orderNumber: string) {
    const row = this.dataTable.locator('tr', { hasText: orderNumber })
    await row.click()
  }

  /**
   * 발주 생성 버튼 클릭
   */
  async clickCreateOrder() {
    await this.createButton.click()
  }

  /**
   * 발주 상세 다이얼로그 확인
   */
  async isDetailDialogOpen(): Promise<boolean> {
    const dialog = this.page.getByRole('dialog')
    return await dialog.isVisible()
  }

  /**
   * 다이얼로그 닫기
   */
  async closeDialog() {
    const closeButton = this.page.getByRole('button', { name: /닫기|취소|close/i })
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }

  /**
   * 페이지 제목 확인
   */
  async hasCorrectTitle(): Promise<boolean> {
    const title = await this.getPageTitle()
    return title.includes('발주')
  }
}
