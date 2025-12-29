/**
 * Shipment Plan Page Object
 * 출고 계획 등록 페이지
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class ShipmentPlanPage extends BasePage {
  // 테이블
  readonly dataTable: Locator

  // 조회조건
  readonly startDateInput: Locator
  readonly endDateInput: Locator
  readonly partnerSelect: Locator
  readonly planTypeSelect: Locator
  readonly searchButton: Locator

  // 기능 버튼
  readonly addButton: Locator
  readonly deleteButton: Locator

  // 다이얼로그
  readonly addDialog: Locator
  readonly dialogSaveButton: Locator
  readonly dialogCancelButton: Locator

  // 사이드 요약
  readonly summaryPanel: Locator

  constructor(page: Page) {
    super(page)
    this.dataTable = page.locator('table')

    this.startDateInput = page.locator('input[type="date"]').first()
    this.endDateInput = page.locator('input[type="date"]').nth(1)
    this.partnerSelect = page.locator('[role="combobox"]').first()
    this.planTypeSelect = page.locator('[role="combobox"]').nth(1)
    this.searchButton = page.getByRole('button', { name: /조회/i })

    this.addButton = page.getByRole('button', { name: /개별.*등록|등록/i })
    this.deleteButton = page.getByRole('button', { name: /삭제/i })

    this.addDialog = page.getByRole('dialog')
    this.dialogSaveButton = page.getByRole('button', { name: /저장|등록/i })
    this.dialogCancelButton = page.getByRole('button', { name: /취소/i })

    this.summaryPanel = page.locator('aside').first()
  }

  /**
   * 출고 계획 페이지로 이동
   */
  async goto() {
    await super.goto('/orders/shipment-plan')
  }

  /**
   * 개별 등록 다이얼로그 열기
   */
  async openAddDialog() {
    await this.addButton.click()
    await this.addDialog.waitFor({ state: 'visible' })
  }

  /**
   * 다이얼로그 닫기
   */
  async closeDialog() {
    await this.dialogCancelButton.click()
    await this.addDialog.waitFor({ state: 'hidden' })
  }

  /**
   * 출고 계획 등록
   */
  async addPlan(data: {
    planDate: string
    partnerId: string
    productId: string
    quantity: number
  }) {
    await this.openAddDialog()

    // 날짜 입력
    const dateInput = this.addDialog.locator('input[type="date"]')
    await dateInput.fill(data.planDate)

    // 수량 입력
    const quantityInput = this.addDialog.locator('input[type="number"]')
    await quantityInput.fill(data.quantity.toString())

    // 저장
    await this.dialogSaveButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 테이블 행 수
   */
  async getRowCount(): Promise<number> {
    const rows = this.dataTable.locator('tbody tr')
    return await rows.count()
  }

  /**
   * 요약 정보 확인
   */
  async getSummary(): Promise<{ totalPlans: number; totalQuantity: number }> {
    const totalText = await this.summaryPanel.textContent()
    const planMatch = totalText?.match(/(\d+)\s*건/)
    const qtyMatch = totalText?.match(/(\d+)\s*개/)

    return {
      totalPlans: planMatch?.[1] ? parseInt(planMatch[1], 10) : 0,
      totalQuantity: qtyMatch?.[1] ? parseInt(qtyMatch[1], 10) : 0,
    }
  }
}
