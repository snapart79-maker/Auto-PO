/**
 * CalculateCurrentStockUseCase
 * 현재고 계산 UseCase
 *
 * 공식: 현재고 = 초기재고 + 입고 - 출고 + 조정
 */

import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type {
  IInitialInventoryRepository,
  IInventoryRepository,
  IInventoryAdjustmentRepository,
} from '@domain/repositories/IInventoryRepository'
import { CurrentInventory } from '@domain/entities/CurrentInventory'

/**
 * UseCase 의존성
 */
export interface CalculateCurrentStockDependencies {
  productRepository: IProductRepository
  initialInventoryRepository: IInitialInventoryRepository
  inventoryRepository: IInventoryRepository
  adjustmentRepository: IInventoryAdjustmentRepository
}

/**
 * 현재고 계산 UseCase
 */
export class CalculateCurrentStockUseCase {
  constructor(private readonly deps: CalculateCurrentStockDependencies) {}

  /**
   * 지정된 제품들의 현재고를 계산
   *
   * @param productIds 제품 ID 배열
   * @returns CurrentInventory 배열
   */
  async execute(productIds: string[]): Promise<CurrentInventory[]> {
    if (productIds.length === 0) {
      return []
    }

    const products = await this.deps.productRepository.findByIds(productIds)
    const results: CurrentInventory[] = []

    for (const product of products) {
      // 1. 초기재고 조회 (최신)
      const initialInventory = await this.deps.initialInventoryRepository.findLatestByProduct(
        product.id
      )
      const initialQty = initialInventory?.quantity ?? 0

      // 2. 입출고 이력 조회
      const transactions = await this.deps.inventoryRepository.findAll({
        productId: product.id,
      })

      // 3. 입고/출고 합계 계산
      let inboundQty = 0
      let outboundQty = 0
      for (const tx of transactions) {
        if (tx.transactionType === 'IN') {
          inboundQty += tx.quantity
        } else if (tx.transactionType === 'OUT') {
          outboundQty += tx.quantity
        }
      }

      // 4. 재고 조정 합계 조회
      const adjustmentSummary = await this.deps.adjustmentRepository.getAdjustmentSummary(
        product.id
      )
      const adjustmentQty = adjustmentSummary.netAdjustment

      // 5. CurrentInventory 생성
      const currentInventory = CurrentInventory.create({
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        vehicleName: undefined, // TODO: 차종 조회 필요시 추가
        initialQty,
        inboundQty,
        outboundQty,
        adjustmentQty,
        safetyStock: 0, // TODO: 제품별 안전재고 설정 또는 시스템 설정에서 조회
      })

      results.push(currentInventory)
    }

    return results
  }

  /**
   * 모든 활성 제품의 현재고를 계산
   */
  async executeForAll(): Promise<CurrentInventory[]> {
    const allProducts = await this.deps.productRepository.findAll({ isActive: true })
    const productIds = allProducts.map((p) => p.id)
    return this.execute(productIds)
  }
}
