/**
 * MRPCalculationService
 * MRP (Material Requirements Planning) 핵심 계산 로직
 *
 * 외부 의존성 ZERO - 순수 TypeScript
 * @domain만 import 가능
 */

/**
 * MRP 계산 결과
 */
export interface MRPCalculationResult {
  safetyStock: number
  netRequirement: number
  reorderPoint: number
  needsOrder: boolean
  recommendedQuantity: number
}

/**
 * MRP 계산 서비스
 * 안전재고, 순소요량, 발주점 계산
 */
export class MRPCalculationService {
  /**
   * 안전재고 계산
   * 공식: 일평균출하량 × 리드타임 × 안전계수
   *
   * @param dailyAverage 일평균 출하량
   * @param leadTime 리드타임 (일)
   * @param multiplier 안전계수 (국내 1.2, 베트남 1.5)
   * @returns 안전재고 수량
   */
  calculateSafetyStock(
    dailyAverage: number,
    leadTime: number,
    multiplier: number
  ): number {
    if (dailyAverage <= 0 || leadTime <= 0) {
      return 0
    }
    return Math.round(dailyAverage * leadTime * multiplier)
  }

  /**
   * 순소요량 계산
   * 공식: 총소요량 - 현재고 - 기발주량 + 안전재고
   *
   * @param totalRequirement 총 소요량 (예상 출하량)
   * @param currentStock 현재 재고
   * @param pendingOrders 기발주량 (미입고)
   * @param safetyStock 안전재고
   * @returns 순소요량 (음수일 경우 발주 불필요)
   */
  calculateNetRequirement(
    totalRequirement: number,
    currentStock: number,
    pendingOrders: number,
    safetyStock: number
  ): number {
    return totalRequirement - currentStock - pendingOrders + safetyStock
  }

  /**
   * 발주점 계산
   * 공식: 안전재고 + (일평균소비량 × 리드타임)
   *
   * @param safetyStock 안전재고
   * @param dailyConsumption 일평균 소비량
   * @param leadTime 리드타임 (일)
   * @returns 발주점 (현재고가 이 수준 이하면 발주 필요)
   */
  calculateReorderPoint(
    safetyStock: number,
    dailyConsumption: number,
    leadTime: number
  ): number {
    return safetyStock + dailyConsumption * leadTime
  }

  /**
   * 발주 필요 여부 판단
   * 현재고가 발주점 이하이면 발주 필요
   *
   * @param currentStock 현재 재고
   * @param reorderPoint 발주점
   * @returns 발주 필요 여부
   */
  needsOrder(currentStock: number, reorderPoint: number): boolean {
    return currentStock <= reorderPoint
  }

  /**
   * 권장 발주량 계산
   * 순소요량이 양수면 그 값, 아니면 0
   *
   * @param netRequirement 순소요량
   * @returns 권장 발주량
   */
  getRecommendedQuantity(netRequirement: number): number {
    return Math.max(0, netRequirement)
  }

  /**
   * 전체 MRP 계산 실행
   *
   * @param params MRP 계산 파라미터
   * @returns MRP 계산 결과
   */
  calculate(params: {
    dailyAverage: number
    leadTime: number
    multiplier: number
    totalRequirement: number
    currentStock: number
    pendingOrders: number
  }): MRPCalculationResult {
    const {
      dailyAverage,
      leadTime,
      multiplier,
      totalRequirement,
      currentStock,
      pendingOrders,
    } = params

    const safetyStock = this.calculateSafetyStock(dailyAverage, leadTime, multiplier)
    const netRequirement = this.calculateNetRequirement(
      totalRequirement,
      currentStock,
      pendingOrders,
      safetyStock
    )
    const reorderPoint = this.calculateReorderPoint(safetyStock, dailyAverage, leadTime)
    const needsOrder = this.needsOrder(currentStock, reorderPoint)
    const recommendedQuantity = this.getRecommendedQuantity(netRequirement)

    return {
      safetyStock,
      netRequirement,
      reorderPoint,
      needsOrder,
      recommendedQuantity,
    }
  }
}
