/**
 * ConsolidateVietnamOrdersUseCase
 * 베트남 주간 통합 발주 UseCase
 *
 * 월~목 발주권고를 금요일에 통합하여 단일 발주로 생성
 * @domain만 import 가능
 */

import { Money } from '@domain/valueObjects/Money'
import type { DateRange } from '@domain/valueObjects/DateRange'

/**
 * 발주 권고 (MRP 계산 결과에서 발주 필요한 항목)
 */
export interface OrderRecommendation {
  id: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: Money
  recommendedDate: Date
  partnerId: string
}

/**
 * 통합된 발주 항목
 */
export interface ConsolidatedItem {
  productId: string
  productCode: string
  productName: string
  totalQuantity: number
  unitPrice: Money
  totalPrice: Money
  sourceRecommendationIds: string[]
}

/**
 * 통합 발주
 */
export interface ConsolidatedOrder {
  partnerId: string
  weekRange: DateRange
  shipmentDate: Date
  items: ConsolidatedItem[]
  totalQuantity: number
  totalAmount: Money
}

/**
 * 베트남 주간 통합 발주 UseCase
 */
export class ConsolidateVietnamOrdersUseCase {
  /**
   * 발주 권고 통합 실행
   *
   * @param recommendations 발주 권고 목록 (월~목)
   * @param weekRange 주간 범위
   * @param shipmentDate 선적일
   * @param partnerId 베트남 거래처 ID
   * @returns 통합 발주
   */
  execute(
    recommendations: OrderRecommendation[],
    weekRange: DateRange,
    shipmentDate: Date,
    partnerId: string
  ): ConsolidatedOrder {
    // 빈 권고 목록 처리
    if (recommendations.length === 0) {
      return {
        partnerId,
        weekRange,
        shipmentDate,
        items: [],
        totalQuantity: 0,
        totalAmount: Money.create(0, 'KRW'),
      }
    }

    // 제품별로 그룹화
    const productMap = new Map<
      string,
      {
        productId: string
        productCode: string
        productName: string
        quantity: number
        unitPrice: Money
        sourceIds: string[]
      }
    >()

    for (const rec of recommendations) {
      const existing = productMap.get(rec.productId)

      if (existing) {
        // 동일 제품: 수량 합산
        existing.quantity += rec.quantity
        existing.sourceIds.push(rec.id)
      } else {
        // 새 제품 추가
        productMap.set(rec.productId, {
          productId: rec.productId,
          productCode: rec.productCode,
          productName: rec.productName,
          quantity: rec.quantity,
          unitPrice: rec.unitPrice,
          sourceIds: [rec.id],
        })
      }
    }

    // ConsolidatedItem 배열 생성
    const items: ConsolidatedItem[] = []
    let totalQuantity = 0
    let totalAmount = Money.create(0, recommendations[0]?.unitPrice.currency ?? 'KRW')

    for (const item of productMap.values()) {
      const totalPrice = item.unitPrice.multiply(item.quantity)

      items.push({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        totalQuantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        sourceRecommendationIds: item.sourceIds,
      })

      totalQuantity += item.quantity
      totalAmount = totalAmount.add(totalPrice)
    }

    return {
      partnerId,
      weekRange,
      shipmentDate,
      items,
      totalQuantity,
      totalAmount,
    }
  }

  /**
   * 거래처별 통합 발주 생성
   * (여러 베트남 거래처가 있을 경우)
   */
  executeByPartner(
    recommendations: OrderRecommendation[],
    weekRange: DateRange,
    shipmentDate: Date
  ): ConsolidatedOrder[] {
    // 거래처별 그룹화
    const partnerMap = new Map<string, OrderRecommendation[]>()

    for (const rec of recommendations) {
      const existing = partnerMap.get(rec.partnerId) ?? []
      existing.push(rec)
      partnerMap.set(rec.partnerId, existing)
    }

    // 거래처별 통합 발주 생성
    const orders: ConsolidatedOrder[] = []

    for (const [partnerId, recs] of partnerMap) {
      orders.push(this.execute(recs, weekRange, shipmentDate, partnerId))
    }

    return orders
  }
}
