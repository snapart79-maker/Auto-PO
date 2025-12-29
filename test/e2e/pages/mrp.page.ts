/**
 * MRP Page Object
 * MRP 계산 / 발주 권고 페이지
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class MRPPage extends BasePage {
  // MRP 테이블
  readonly mrpTable: Locator
  readonly dataTable: Locator

  // 버튼
  readonly calculateButton: Locator
  readonly selectedOrderButton: Locator
  readonly allOrderButton: Locator
  readonly refreshButton: Locator

  // 체크박스
  readonly selectAllCheckbox: Locator
  readonly rowCheckboxes: Locator

  // 조회조건
  readonly baseDateInput: Locator
  readonly productCodeInput: Locator

  // 발주 권고 정보
  readonly recommendedQuantityColumn: Locator

  constructor(page: Page) {
    super(page)
    this.mrpTable = page.locator('table')
    this.dataTable = page.locator('[class*="table"], table')
    this.calculateButton = page.getByRole('button', { name: /MRP.*계산|재계산/i })
    this.selectedOrderButton = page.getByRole('button', { name: /선택.*발주/i })
    this.allOrderButton = page.getByRole('button', { name: /전체.*발주/i })
    this.refreshButton = page.getByRole('button', { name: /새로고침/i })

    this.selectAllCheckbox = page.locator('thead').locator('[type="checkbox"], [role="checkbox"]')
    this.rowCheckboxes = page.locator('tbody').locator('[type="checkbox"], [role="checkbox"]')

    this.baseDateInput = page.locator('input[type="date"]').first()
    this.productCodeInput = page.getByPlaceholder(/품번/i)

    this.recommendedQuantityColumn = page.locator('td').filter({ hasText: /^\d+$/ })
  }

  /**
   * MRP 페이지로 이동
   */
  async goto() {
    await super.goto('/mrp')
  }

  /**
   * 베트남 발주 페이지로 이동
   */
  async gotoVietnam() {
    await super.goto('/mrp/vietnam')
  }

  /**
   * MRP 계산 실행
   */
  async calculate() {
    await this.calculateButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 행 체크박스 선택
   */
  async selectRow(index: number) {
    const checkbox = this.rowCheckboxes.nth(index)
    await checkbox.click()
  }

  /**
   * 전체 선택
   */
  async selectAll() {
    await this.selectAllCheckbox.click()
  }

  /**
   * 선택된 항목 수 가져오기
   */
  async getSelectedCount(): Promise<number> {
    const checked = this.page.locator('tbody [data-state="checked"], tbody input:checked')
    return await checked.count()
  }

  /**
   * 선택 발주 실행
   */
  async orderSelected() {
    await this.selectedOrderButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 전체 발주 실행
   */
  async orderAll() {
    await this.allOrderButton.click()
    await this.waitForPageLoad()
  }

  /**
   * 발주 권고량 > 0 인 행 수
   */
  async getRecommendedRowCount(): Promise<number> {
    const rows = this.mrpTable.locator('tbody tr')
    let count = 0
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator('td')
      const cellCount = await cells.count()
      if (cellCount > 0) {
        // 발주권고량 컬럼 확인 (보통 뒤쪽 컬럼)
        const lastCells = await cells.allTextContents()
        const hasRecommendation = lastCells.some((text) => {
          const num = parseInt(text.replace(/,/g, ''), 10)
          return !isNaN(num) && num > 0
        })
        if (hasRecommendation) count++
      }
    }
    return count
  }

  /**
   * MRP 결과 테이블 행 수
   */
  async getMRPRowCount(): Promise<number> {
    const rows = this.mrpTable.locator('tbody tr')
    return await rows.count()
  }
}
