/**
 * CalculateMRPUseCase
 * MRP (Material Requirements Planning) 계산 UseCase
 *
 * 제품별 안전재고, 순소요량, 발주점 계산
 * @domain만 import 가능
 */

import type { DateRange } from '@domain/valueObjects/DateRange'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import { MRPCalculationService } from '../services/MRPCalculationService'

/**
 * MRP 계산 결과
 */
export interface MRPResult {
  productId: string
  productCode: string
  productName: string
  currentStock: number
  pendingOrders: number
  dailyAverage: number
  leadTime: number
  safetyStock: number
  reorderPoint: number
  netRequirement: number
  needsOrder: boolean
  recommendedQuantity: number
  supplierType: string
}

/**
 * MRP 계산 UseCase 의존성
 */
export interface CalculateMRPDependencies {
  productRepository: IProductRepository
  inventoryRepository: IInventoryRepository
  orderRepository: IOrderRepository
}

/**
 * MRP 계산 UseCase
 */
export class CalculateMRPUseCase {
  private readonly mrpService: MRPCalculationService

  constructor(private readonly deps: CalculateMRPDependencies) {
    this.mrpService = new MRPCalculationService()
  }

  /**
   * MRP 계산 실행
   *
   * @param productIds 계산 대상 제품 ID 목록
   * @param dateRange 일평균 계산 기간
   * @param totalRequirement 총 소요량 (기본값: 리드타임 동안의 예상 출하량)
   * @returns MRP 계산 결과 배열
   */
  async execute(
    productIds: string[],
    dateRange: DateRange,
    totalRequirementOverride?: Map<string, number>
  ): Promise<MRPResult[]> {
    const results: MRPResult[] = []

    // 제품 조회
    const products = await this.deps.productRepository.findByIds(productIds)

    for (const product of products) {
      // 현재 재고 조회
      const currentStock = await this.deps.inventoryRepository.getCurrentStock(product.id)

      // 기발주량 (미입고) 조회
      const pendingOrders = await this.deps.orderRepository.getPendingQuantity(product.id)

      // 일평균 출하량 조회
      const dailyAverage = await this.deps.inventoryRepository.getDailyAverageOutbound(
        product.id,
        dateRange
      )

      // 리드타임 및 안전계수
      const leadTime = product.getLeadTime()
      const multiplier = product.getSafetyStockMultiplier()

      // 총 소요량 (오버라이드 또는 리드타임 동안 예상 출하량)
      const totalRequirement =
        totalRequirementOverride?.get(product.id) ?? dailyAverage * leadTime

      // MRP 계산
      const calculation = this.mrpService.calculate({
        dailyAverage,
        leadTime,
        multiplier,
        totalRequirement,
        currentStock,
        pendingOrders,
      })

      results.push({
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        currentStock,
        pendingOrders,
        dailyAverage,
        leadTime,
        safetyStock: calculation.safetyStock,
        reorderPoint: calculation.reorderPoint,
        netRequirement: calculation.netRequirement,
        needsOrder: calculation.needsOrder,
        recommendedQuantity: calculation.recommendedQuantity,
        supplierType: product.primarySupplier.value,
      })
    }

    return results
  }

  /**
   * 발주 필요 제품만 필터링
   */
  async getOrderRecommendations(
    productIds: string[],
    dateRange: DateRange
  ): Promise<MRPResult[]> {
    const results = await this.execute(productIds, dateRange)
    return results.filter((r) => r.needsOrder && r.recommendedQuantity > 0)
  }
}
