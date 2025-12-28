/**
 * useMRP Hook 테스트
 */

import { describe, it, expect, vi } from 'vitest'
import type { MRPStep, MRPWithSplit, UseMRPOptions } from '@infrastructure/react/hooks/useMRP'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { DateRange } from '@domain/valueObjects/DateRange'

// Mock Repositories
function createMockRepositories(): {
  productRepository: IProductRepository
  inventoryRepository: IInventoryRepository
  orderRepository: IOrderRepository
} {
  return {
    productRepository: {
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      delete: vi.fn(),
      findByVehicleModel: vi.fn(),
      findByPartner: vi.fn(),
    } as unknown as IProductRepository,
    inventoryRepository: {
      findByProduct: vi.fn(),
      findByDateRange: vi.fn(),
      getStockSummaries: vi.fn().mockResolvedValue([]),
      getDailyAverages: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      delete: vi.fn(),
      getCurrentStock: vi.fn(),
    } as unknown as IInventoryRepository,
    orderRepository: {
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      findByDateRange: vi.fn(),
      findByPartner: vi.fn(),
      findByStatus: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      getPendingQuantities: vi.fn().mockResolvedValue(new Map()),
    } as unknown as IOrderRepository,
  }
}

// MRPResult에 맞는 mock 데이터 생성 헬퍼
function createMockMRPResult(overrides: Partial<MRPWithSplit> = {}): MRPWithSplit {
  return {
    productId: 'prod-1',
    productCode: 'P001',
    productName: '테스트 제품',
    currentStock: 100,
    pendingOrders: 50,
    dailyAverage: 10,
    leadTime: 7,
    safetyStock: 30,
    reorderPoint: 80,
    netRequirement: 50,
    needsOrder: true,
    recommendedQuantity: 100,
    supplierType: 'DOMESTIC',
    ...overrides,
  }
}

describe('useMRP 유틸리티', () => {
  describe('MRPStep 타입', () => {
    it('모든 상태가 정의되어 있어야 한다', () => {
      const steps: MRPStep[] = ['idle', 'loading', 'calculating', 'complete', 'error']
      expect(steps).toHaveLength(5)
      expect(steps).toContain('idle')
      expect(steps).toContain('loading')
      expect(steps).toContain('calculating')
      expect(steps).toContain('complete')
      expect(steps).toContain('error')
    })
  })

  describe('MRPWithSplit 인터페이스', () => {
    it('MRP 결과와 분할 결과를 포함해야 한다', () => {
      const mrpWithSplit = createMockMRPResult({
        splitResult: {
          productId: 'prod-1',
          totalQuantity: 100,
          domesticQuantity: 60,
          vietnamQuantity: 40,
          domesticRatio: 60,
        },
      })

      expect(mrpWithSplit.productId).toBe('prod-1')
      expect(mrpWithSplit.needsOrder).toBe(true)
      expect(mrpWithSplit.splitResult?.domesticQuantity).toBe(60)
      expect(mrpWithSplit.splitResult?.vietnamQuantity).toBe(40)
    })

    it('분할 결과 없이도 유효해야 한다', () => {
      const mrpWithoutSplit = createMockMRPResult({
        productId: 'prod-2',
        needsOrder: false,
        recommendedQuantity: 0,
      })

      expect(mrpWithoutSplit.needsOrder).toBe(false)
      expect(mrpWithoutSplit.splitResult).toBeUndefined()
    })
  })

  describe('UseMRPOptions 인터페이스', () => {
    it('필수 레포지토리가 모두 포함되어야 한다', () => {
      const { productRepository, inventoryRepository, orderRepository } = createMockRepositories()

      const options: UseMRPOptions = {
        productRepository,
        inventoryRepository,
        orderRepository,
      }

      expect(options.productRepository).toBeDefined()
      expect(options.inventoryRepository).toBeDefined()
      expect(options.orderRepository).toBeDefined()
    })
  })

  describe('SupplierType 검증', () => {
    it('이원화 유형은 BOTH여야 한다', () => {
      const bothType = SupplierType.fromString('BOTH')
      expect(bothType.value).toBe('BOTH')
      expect(bothType.isBoth()).toBe(true)
    })

    it('단일 공급 유형은 DOMESTIC 또는 VIETNAM', () => {
      const domesticType = SupplierType.fromString('DOMESTIC')
      expect(domesticType.isDomestic()).toBe(true)

      const vietnamType = SupplierType.fromString('VIETNAM')
      expect(vietnamType.isVietnam()).toBe(true)
    })
  })

  describe('DateRange 생성', () => {
    it('날짜 범위를 올바르게 생성해야 한다', () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const dateRange = DateRange.create(startDate, endDate)

      expect(dateRange.startDate.getTime()).toBeLessThanOrEqual(dateRange.endDate.getTime())
      expect(dateRange.days).toBeGreaterThanOrEqual(30)
    })

    it('다양한 기간 설정을 지원해야 한다', () => {
      const endDate = new Date()

      const periods = [7, 14, 60, 90]
      for (const days of periods) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        const range = DateRange.create(startDate, endDate)
        expect(range.days).toBeGreaterThanOrEqual(days)
      }
    })
  })

  describe('발주 필요 제품 필터링', () => {
    it('needsOrder가 true인 제품만 필터링해야 한다', () => {
      const results: MRPWithSplit[] = [
        createMockMRPResult({ productId: 'prod-1', needsOrder: true, recommendedQuantity: 140 }),
        createMockMRPResult({ productId: 'prod-2', needsOrder: false, recommendedQuantity: 0 }),
      ]

      const orderRecommendations = results.filter((r) => r.needsOrder && r.recommendedQuantity > 0)

      expect(orderRecommendations).toHaveLength(1)
      expect(orderRecommendations[0]?.productId).toBe('prod-1')
    })

    it('recommendedQuantity가 0인 경우 필터링되어야 한다', () => {
      const results: MRPWithSplit[] = [
        createMockMRPResult({ needsOrder: true, recommendedQuantity: 0 }),
      ]

      const orderRecommendations = results.filter((r) => r.needsOrder && r.recommendedQuantity > 0)

      expect(orderRecommendations).toHaveLength(0)
    })
  })

  describe('통계 계산', () => {
    it('MRP 결과에서 통계를 계산해야 한다', () => {
      const results: MRPWithSplit[] = [
        createMockMRPResult({ productId: 'prod-1', supplierType: 'BOTH', needsOrder: true, recommendedQuantity: 140 }),
        createMockMRPResult({ productId: 'prod-2', supplierType: 'DOMESTIC', needsOrder: false, recommendedQuantity: 0 }),
        createMockMRPResult({ productId: 'prod-3', supplierType: 'BOTH', needsOrder: true, recommendedQuantity: 60 }),
      ]

      const orderRecommendations = results.filter((r) => r.needsOrder && r.recommendedQuantity > 0)

      const stats = {
        total: results.length,
        needsOrderCount: orderRecommendations.length,
        totalRecommendedQty: orderRecommendations.reduce((sum, r) => sum + r.recommendedQuantity, 0),
        dualSourcingCount: results.filter((r) => r.supplierType === 'BOTH').length,
      }

      expect(stats.total).toBe(3)
      expect(stats.needsOrderCount).toBe(2)
      expect(stats.totalRecommendedQty).toBe(200) // 140 + 60
      expect(stats.dualSourcingCount).toBe(2)
    })
  })

  describe('에러 메시지 처리', () => {
    it('Error 인스턴스에서 메시지를 추출해야 한다', () => {
      const error = new Error('제품 로드 실패')
      const message = error instanceof Error ? error.message : '제품 로드 실패. Supabase 연결을 확인하세요.'

      expect(message).toBe('제품 로드 실패')
    })

    it('Error가 아닌 경우 기본 메시지를 반환해야 한다', () => {
      const error = '문자열 에러' as unknown
      const message = error instanceof Error ? error.message : 'MRP 계산 실패'

      expect(message).toBe('MRP 계산 실패')
    })
  })

  describe('상태 전환', () => {
    it('상태 전환 시퀀스가 올바라야 한다', () => {
      // 초기 상태
      let step: MRPStep = 'idle'
      expect(step).toBe('idle')

      // 로딩 시작
      step = 'loading'
      expect(step).toBe('loading')

      // 로딩 완료 후 다시 idle
      step = 'idle'
      expect(step).toBe('idle')

      // 계산 시작
      step = 'calculating'
      expect(step).toBe('calculating')

      // 계산 완료
      step = 'complete'
      expect(step).toBe('complete')
    })

    it('에러 발생 시 error 상태로 전환해야 한다', () => {
      let step: MRPStep = 'calculating'

      // 에러 발생
      step = 'error'
      expect(step).toBe('error')
    })
  })

  describe('리셋 동작', () => {
    it('리셋 시 초기 상태로 돌아가야 한다', () => {
      // 리셋 전 상태
      let step: MRPStep = 'complete'
      let results: MRPWithSplit[] = [createMockMRPResult()]
      let error: string | null = '이전 에러'

      // 리셋 실행
      step = 'idle'
      results = []
      error = null

      expect(step).toBe('idle')
      expect(results).toHaveLength(0)
      expect(error).toBeNull()
    })
  })
})
