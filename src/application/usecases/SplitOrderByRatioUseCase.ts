/**
 * SplitOrderByRatioUseCase
 * 이원화 발주 분할 UseCase
 *
 * 국내/베트남 비율에 따라 발주량을 분할
 * @domain만 import 가능
 */

import type { Product } from '@domain/entities/Product'

/**
 * 분할 결과
 */
export interface SplitResult {
  productId: string
  totalQuantity: number
  domesticQuantity: number
  vietnamQuantity: number
  domesticRatio: number
}

/**
 * 이원화 발주 분할 UseCase
 */
export class SplitOrderByRatioUseCase {
  /**
   * 발주량 분할 실행
   *
   * @param product 제품 (이원화 설정 포함)
   * @param totalQuantity 총 발주량
   * @returns 분할 결과
   */
  execute(product: Product, totalQuantity: number): SplitResult {
    if (totalQuantity <= 0) {
      return {
        productId: product.id,
        totalQuantity: 0,
        domesticQuantity: 0,
        vietnamQuantity: 0,
        domesticRatio: product.domesticRatio,
      }
    }

    // Product의 splitQuantity 메서드 활용
    const split = product.splitQuantity(totalQuantity)

    return {
      productId: product.id,
      totalQuantity,
      domesticQuantity: split.domestic,
      vietnamQuantity: split.vietnam,
      domesticRatio: product.domesticRatio,
    }
  }

  /**
   * 여러 제품 일괄 분할
   *
   * @param items 제품별 발주량
   * @returns 분할 결과 배열
   */
  executeBatch(items: { product: Product; quantity: number }[]): SplitResult[] {
    return items.map(({ product, quantity }) => this.execute(product, quantity))
  }
}
