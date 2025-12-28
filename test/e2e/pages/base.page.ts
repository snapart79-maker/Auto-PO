/**
 * Base Page Object
 * 모든 페이지 객체의 기본 클래스
 */

import { Page, Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page
  readonly sidebar: Locator
  readonly mainContent: Locator
  readonly pageTitle: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('aside')
    this.mainContent = page.locator('main')
    this.pageTitle = page.locator('h1').first()
  }

  /**
   * 페이지 이동
   */
  async goto(path: string) {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 네비게이션 링크 클릭
   */
  async navigateTo(label: string) {
    await this.sidebar.getByRole('link', { name: label }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 페이지 제목 가져오기
   */
  async getPageTitle(): Promise<string> {
    return await this.pageTitle.textContent() ?? ''
  }

  /**
   * 로딩 완료 대기
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 요소가 보일 때까지 대기
   */
  async waitForVisible(locator: Locator) {
    await locator.waitFor({ state: 'visible' })
  }

  /**
   * 버튼 클릭
   */
  async clickButton(name: string) {
    await this.page.getByRole('button', { name }).click()
  }

  /**
   * 테이블 행 수 가져오기
   */
  async getTableRowCount(): Promise<number> {
    const rows = this.mainContent.locator('tbody tr')
    return await rows.count()
  }
}
