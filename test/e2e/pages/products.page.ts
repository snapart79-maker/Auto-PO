/**
 * Products Page Object
 * 제품 관리 페이지 전용 객체
 */

import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class ProductsPage extends BasePage {
  readonly addButton: Locator
  readonly dataTable: Locator
  readonly searchInput: Locator
  readonly filterSelect: Locator

  constructor(page: Page) {
    super(page)
    this.addButton = page.getByRole('button', { name: /추가|등록|새.*제품/i })
    this.dataTable = page.locator('table')
    this.searchInput = page.getByPlaceholder(/검색|찾기/i)
    this.filterSelect = page.locator('select, [role="combobox"]')
  }

  /**
   * 제품 관리 페이지로 이동
   */
  async goto() {
    await super.goto('/products')
  }

  /**
   * 제품 목록 행 수 가져오기
   */
  async getProductCount(): Promise<number> {
    return await this.getTableRowCount()
  }

  /**
   * 제품 검색
   */
  async searchProduct(keyword: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(keyword)
      await this.page.waitForTimeout(300) // 디바운스 대기
    }
  }

  /**
   * 특정 제품 행 클릭
   */
  async clickProductRow(productCode: string) {
    const row = this.dataTable.locator('tr', { hasText: productCode })
    await row.click()
  }

  /**
   * 제품 추가 버튼 클릭
   */
  async clickAddProduct() {
    await this.addButton.click()
  }

  /**
   * 테이블이 비어있는지 확인
   */
  async isTableEmpty(): Promise<boolean> {
    const emptyMessage = this.page.getByText(/데이터.*없|결과.*없|등록.*제품.*없/i)
    return await emptyMessage.isVisible()
  }

  /**
   * 페이지 제목 확인
   */
  async hasCorrectTitle(): Promise<boolean> {
    const title = await this.getPageTitle()
    return title.includes('제품')
  }
}
