/**
 * useMRP Hook
 * MRP 계산 및 결과 관리
 */

import { useState, useCallback, useMemo } from 'react'
import { CalculateMRPUseCase, type MRPResult } from '@application/usecases/CalculateMRPUseCase'
import { SplitOrderByRatioUseCase, type SplitResult } from '@application/usecases/SplitOrderByRatioUseCase'
import { DateRange } from '@domain/valueObjects/DateRange'
import type { Product } from '@domain/entities/Product'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'

export type MRPStep = 'idle' | 'loading' | 'calculating' | 'complete' | 'error'

export interface MRPWithSplit extends MRPResult {
  splitResult?: SplitResult
}

export interface UseMRPOptions {
  productRepository: IProductRepository
  inventoryRepository: IInventoryRepository
  orderRepository: IOrderRepository
}

export interface UseMRPReturn {
  /** 현재 단계 */
  step: MRPStep
  /** MRP 계산 결과 */
  results: MRPWithSplit[]
  /** 발주 필요 제품만 필터링 */
  orderRecommendations: MRPWithSplit[]
  /** 전체 제품 목록 */
  products: Product[]
  /** 에러 메시지 */
  error: string | null
  /** 계산 실행 */
  calculate: (productIds: string[], dateRange: DateRange) => Promise<void>
  /** 제품 목록 로드 */
  loadProducts: (filter?: { vehicleModelId?: string; isActive?: boolean }) => Promise<void>
  /** 분할 계산 포함 */
  calculateWithSplit: (productIds: string[], dateRange: DateRange) => Promise<void>
  /** 리셋 */
  reset: () => void
}

export function useMRP(options: UseMRPOptions): UseMRPReturn {
  const { productRepository, inventoryRepository, orderRepository } = options

  const [step, setStep] = useState<MRPStep>('idle')
  const [results, setResults] = useState<MRPWithSplit[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  // UseCase 인스턴스
  const mrpUseCase = useMemo(
    () =>
      new CalculateMRPUseCase({
        productRepository,
        inventoryRepository,
        orderRepository,
      }),
    [productRepository, inventoryRepository, orderRepository]
  )

  const splitUseCase = useMemo(() => new SplitOrderByRatioUseCase(), [])

  // 제품 목록 로드
  const loadProducts = useCallback(
    async (filter?: { vehicleModelId?: string; isActive?: boolean }) => {
      setStep('loading')
      setError(null)

      try {
        const loadedProducts = await productRepository.findAll({
          ...filter,
          isActive: filter?.isActive ?? true,
        })

        setProducts(loadedProducts)
        setStep('idle')
      } catch (err) {
        // 에러 발생 시에도 빈 배열로 설정하고 idle 상태로 전환 (UI는 표시)
        setProducts([])
        setError(err instanceof Error ? err.message : '제품 로드 실패. Supabase 연결을 확인하세요.')
        setStep('idle')
      }
    },
    [productRepository]
  )

  // MRP 계산 실행
  const calculate = useCallback(
    async (productIds: string[], dateRange: DateRange) => {
      try {
        setStep('calculating')
        setError(null)

        const mrpResults = await mrpUseCase.execute(productIds, dateRange)
        setResults(mrpResults)
        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'MRP 계산 실패')
        setStep('error')
      }
    },
    [mrpUseCase]
  )

  // 분할 계산 포함 MRP 계산
  const calculateWithSplit = useCallback(
    async (productIds: string[], dateRange: DateRange) => {
      try {
        setStep('calculating')
        setError(null)

        // MRP 계산
        const mrpResults = await mrpUseCase.execute(productIds, dateRange)

        // 이원화 제품에 대해 분할 계산 추가
        const productsMap = new Map(products.map((p) => [p.id, p]))

        const resultsWithSplit: MRPWithSplit[] = mrpResults.map((result) => {
          const product = productsMap.get(result.productId)

          if (product && product.isDualSourcing() && result.recommendedQuantity > 0) {
            const splitResult = splitUseCase.execute(product, result.recommendedQuantity)
            return { ...result, splitResult }
          }

          return result
        })

        setResults(resultsWithSplit)
        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'MRP 계산 실패')
        setStep('error')
      }
    },
    [mrpUseCase, splitUseCase, products]
  )

  // 발주 필요 제품만 필터링
  const orderRecommendations = useMemo(
    () => results.filter((r) => r.needsOrder && r.recommendedQuantity > 0),
    [results]
  )

  // 리셋
  const reset = useCallback(() => {
    setStep('idle')
    setResults([])
    setError(null)
  }, [])

  return {
    step,
    results,
    orderRecommendations,
    products,
    error,
    calculate,
    loadProducts,
    calculateWithSplit,
    reset,
  }
}
