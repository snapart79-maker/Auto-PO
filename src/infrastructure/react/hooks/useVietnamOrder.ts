/**
 * useVietnamOrder Hook
 * 베트남 주간 통합 발주 관리
 */

import { useState, useCallback, useMemo } from 'react'
import {
  ConsolidateVietnamOrdersUseCase,
  type OrderRecommendation,
  type ConsolidatedOrder,
} from '@application/usecases/ConsolidateVietnamOrdersUseCase'
import { DateRange } from '@domain/valueObjects/DateRange'
import { Money } from '@domain/valueObjects/Money'
import type { MRPResult } from '@application/usecases/CalculateMRPUseCase'
import type { Product } from '@domain/entities/Product'

export type VietnamOrderStep = 'idle' | 'loading' | 'preview' | 'saving' | 'complete' | 'error'

export interface UseVietnamOrderReturn {
  /** 현재 단계 */
  step: VietnamOrderStep
  /** 통합 발주 */
  consolidatedOrder: ConsolidatedOrder | null
  /** 발주 권고 목록 */
  recommendations: OrderRecommendation[]
  /** 주간 범위 */
  weekRange: DateRange | null
  /** 선적일 */
  shipmentDate: Date | null
  /** 에러 메시지 */
  error: string | null
  /** 주간 범위 설정 */
  setWeekRange: (range: DateRange) => void
  /** 선적일 설정 */
  setShipmentDate: (date: Date) => void
  /** MRP 결과에서 베트남 발주 권고 추출 */
  extractVietnamRecommendations: (
    mrpResults: MRPResult[],
    products: Product[],
    partnerId: string
  ) => void
  /** 통합 발주 미리보기 생성 */
  generatePreview: () => void
  /** 리셋 */
  reset: () => void
}

export function useVietnamOrder(): UseVietnamOrderReturn {
  const [step, setStep] = useState<VietnamOrderStep>('idle')
  const [consolidatedOrder, setConsolidatedOrder] = useState<ConsolidatedOrder | null>(null)
  const [recommendations, setRecommendations] = useState<OrderRecommendation[]>([])
  const [weekRange, setWeekRange] = useState<DateRange | null>(null)
  const [shipmentDate, setShipmentDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string>('')

  // UseCase 인스턴스
  const consolidateUseCase = useMemo(() => new ConsolidateVietnamOrdersUseCase(), [])

  // MRP 결과에서 베트남 발주 권고 추출
  const extractVietnamRecommendations = useCallback(
    (mrpResults: MRPResult[], products: Product[], targetPartnerId: string) => {
      try {
        setStep('loading')
        setError(null)
        setPartnerId(targetPartnerId)

        const productsMap = new Map(products.map((p) => [p.id, p]))

        const vietnamRecs: OrderRecommendation[] = mrpResults
          .filter((r) => {
            // 발주 필요하고
            if (!r.needsOrder || r.recommendedQuantity <= 0) return false

            const product = productsMap.get(r.productId)
            if (!product) return false

            // 베트남 전용 또는 이원화 제품
            return product.isVietnamOnly() || product.isDualSourcing()
          })
          .map((r) => {
            const product = productsMap.get(r.productId)!
            let quantity = r.recommendedQuantity

            // 이원화 제품은 베트남 비율만큼
            if (product.isDualSourcing()) {
              const split = product.splitQuantity(r.recommendedQuantity)
              quantity = split.vietnam
            }

            return {
              id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
              productId: r.productId,
              productCode: r.productCode,
              productName: r.productName,
              quantity,
              unitPrice: product.unitPrice ?? Money.create(0, 'USD'),
              recommendedDate: new Date(),
              partnerId: product.subPartnerId ?? targetPartnerId,
            }
          })
          .filter((r) => r.quantity > 0)

        setRecommendations(vietnamRecs)
        setStep('idle')
      } catch (err) {
        setError(err instanceof Error ? err.message : '베트남 발주 권고 추출 실패')
        setStep('error')
      }
    },
    []
  )

  // 통합 발주 미리보기 생성
  const generatePreview = useCallback(() => {
    try {
      if (!weekRange) {
        throw new Error('주간 범위를 선택해주세요')
      }
      if (!shipmentDate) {
        throw new Error('선적일을 선택해주세요')
      }
      if (recommendations.length === 0) {
        throw new Error('발주 권고가 없습니다')
      }

      setStep('loading')
      setError(null)

      const consolidated = consolidateUseCase.execute(
        recommendations,
        weekRange,
        shipmentDate,
        partnerId
      )

      setConsolidatedOrder(consolidated)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '통합 발주 생성 실패')
      setStep('error')
    }
  }, [consolidateUseCase, recommendations, weekRange, shipmentDate, partnerId])

  // 리셋
  const reset = useCallback(() => {
    setStep('idle')
    setConsolidatedOrder(null)
    setRecommendations([])
    setWeekRange(null)
    setShipmentDate(null)
    setError(null)
    setPartnerId('')
  }, [])

  return {
    step,
    consolidatedOrder,
    recommendations,
    weekRange,
    shipmentDate,
    error,
    setWeekRange,
    setShipmentDate,
    extractVietnamRecommendations,
    generatePreview,
    reset,
  }
}

/**
 * 현재 주의 월요일~금요일 범위 계산
 */
export function getCurrentWeekRange(): DateRange {
  const today = new Date()
  const dayOfWeek = today.getDay()

  // 월요일 (0=일요일이므로 조정 필요)
  const monday = new Date(today)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + daysToMonday)
  monday.setHours(0, 0, 0, 0)

  // 금요일
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)

  return DateRange.create(monday, friday)
}

/**
 * 다음 금요일 날짜 계산 (선적일 기본값)
 */
export function getNextFriday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek)

  const friday = new Date(today)
  friday.setDate(today.getDate() + daysUntilFriday)
  friday.setHours(0, 0, 0, 0)

  return friday
}
