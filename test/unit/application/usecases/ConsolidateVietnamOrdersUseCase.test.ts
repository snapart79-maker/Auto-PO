import { describe, it, expect, beforeEach } from 'vitest'
import { ConsolidateVietnamOrdersUseCase } from '@application/usecases/ConsolidateVietnamOrdersUseCase'
import { Money } from '@domain/valueObjects/Money'
import { DateRange } from '@domain/valueObjects/DateRange'

/**
 * ConsolidateVietnamOrdersUseCase 단위 테스트
 *
 * 목적: 베트남 주간 통합 발주 (월~목 발주권고를 금요일에 통합)
 * 비즈니스 규칙:
 * - 월~목 발주권고 누적 후 금요일에 통합 발주서 생성
 * - 동일 품목은 수량 합산
 * - 총금액 = sum(quantity x unitPrice)
 * - 원본 발주권고 ID 추적 가능
 */

interface OrderRecommendation {
  id: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: Money
  recommendedDate: Date
  partnerId: string
}

describe('ConsolidateVietnamOrdersUseCase', () => {
  let useCase: ConsolidateVietnamOrdersUseCase
  const partnerId = 'vietnam-partner-001'

  // 테스트용 날짜 (2025년 1월 첫째 주)
  const monday = new Date('2025-01-06')
  const tuesday = new Date('2025-01-07')
  const wednesday = new Date('2025-01-08')
  const thursday = new Date('2025-01-09')
  const friday = new Date('2025-01-10') // 선적일

  // 테스트용 주간 범위
  const weekRange = DateRange.create(monday, thursday)

  beforeEach(() => {
    useCase = new ConsolidateVietnamOrdersUseCase()
  })

  describe('월~목 발주권고 누적', () => {
    it('4일간 각 100개씩 발주권고 -> 총 400개', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
        {
          id: 'rec-002',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: tuesday,
          partnerId,
        },
        {
          id: 'rec-003',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: wednesday,
          partnerId,
        },
        {
          id: 'rec-004',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: thursday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.totalQuantity).toBe(400)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!.totalQuantity).toBe(400)
    })
  })

  describe('동일 품목 수량 합산', () => {
    it('A품목 100+200+50 = 350개', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
        {
          id: 'rec-002',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 200,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: tuesday,
          partnerId,
        },
        {
          id: 'rec-003',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 50,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: wednesday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!.productId).toBe('product-A')
      expect(result.items[0]!.totalQuantity).toBe(350)
    })
  })

  describe('다른 품목 별도 항목 유지', () => {
    it('A품목과 B품목은 별도 항목으로 분리', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
        {
          id: 'rec-002',
          productId: 'product-B',
          productCode: 'PRD-B',
          productName: '와이어하네스 B타입',
          quantity: 200,
          unitPrice: Money.create(2000, 'KRW'),
          recommendedDate: tuesday,
          partnerId,
        },
        {
          id: 'rec-003',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 50,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: wednesday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.items).toHaveLength(2)

      const itemA = result.items.find((item) => item.productId === 'product-A')
      const itemB = result.items.find((item) => item.productId === 'product-B')

      expect(itemA).toBeDefined()
      expect(itemA!.totalQuantity).toBe(150)

      expect(itemB).toBeDefined()
      expect(itemB!.totalQuantity).toBe(200)
    })
  })

  describe('총금액 계산', () => {
    it('sum(quantity x unitPrice) 계산', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
        {
          id: 'rec-002',
          productId: 'product-B',
          productCode: 'PRD-B',
          productName: '와이어하네스 B타입',
          quantity: 50,
          unitPrice: Money.create(2000, 'KRW'),
          recommendedDate: tuesday,
          partnerId,
        },
      ]
      // 예상: (100 x 1000) + (50 x 2000) = 100,000 + 100,000 = 200,000 KRW

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.totalAmount.amount).toBe(200000)
      expect(result.totalAmount.currency).toBe('KRW')

      // 개별 항목 totalPrice 검증
      const itemA = result.items.find((item) => item.productId === 'product-A')
      const itemB = result.items.find((item) => item.productId === 'product-B')

      expect(itemA!.totalPrice.amount).toBe(100000) // 100 x 1000
      expect(itemB!.totalPrice.amount).toBe(100000) // 50 x 2000
    })
  })

  describe('선적일 포함', () => {
    it('통합 발주서에 선적일이 포함됨', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
      ]
      const shipmentDate = friday

      // Act
      const result = useCase.execute(recommendations, weekRange, shipmentDate, partnerId)

      // Assert
      expect(result.shipmentDate.getTime()).toBe(shipmentDate.getTime())
    })
  })

  describe('원본 발주권고 ID 추적', () => {
    it('통합된 항목에 원본 발주권고 ID 목록 유지', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
        {
          id: 'rec-002',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 200,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: tuesday,
          partnerId,
        },
        {
          id: 'rec-003',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 50,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: wednesday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      const itemA = result.items.find((item) => item.productId === 'product-A')
      expect(itemA).toBeDefined()
      expect(itemA!.sourceRecommendationIds).toHaveLength(3)
      expect(itemA!.sourceRecommendationIds).toContain('rec-001')
      expect(itemA!.sourceRecommendationIds).toContain('rec-002')
      expect(itemA!.sourceRecommendationIds).toContain('rec-003')
    })
  })

  describe('빈 권고 목록 처리', () => {
    it('빈 권고 목록 -> 빈 ConsolidatedOrder 반환', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = []

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.items).toHaveLength(0)
      expect(result.totalQuantity).toBe(0)
      expect(result.totalAmount.amount).toBe(0)
      expect(result.partnerId).toBe(partnerId)
      expect(result.shipmentDate.getTime()).toBe(friday.getTime())
    })
  })

  describe('단일 품목 단일 권고', () => {
    it('단일 품목, 단일 권고 -> 그대로 통합', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 250,
          unitPrice: Money.create(1500, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!.productId).toBe('product-A')
      expect(result.items[0]!.productName).toBe('와이어하네스 A타입')
      expect(result.items[0]!.totalQuantity).toBe(250)
      expect(result.items[0]!.unitPrice.equals(Money.create(1500, 'KRW'))).toBe(true)
      expect(result.items[0]!.totalPrice.amount).toBe(375000) // 250 x 1500
      expect(result.items[0]!.sourceRecommendationIds).toEqual(['rec-001'])
      expect(result.totalQuantity).toBe(250)
      expect(result.totalAmount.amount).toBe(375000)
    })
  })

  describe('주차 범위 포함', () => {
    it('통합 발주서에 올바른 주차 범위 포함', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.weekRange).toBeDefined()
      expect(result.weekRange.startDate.getTime()).toBe(monday.getTime())
      expect(result.weekRange.endDate.getTime()).toBe(thursday.getTime())
    })
  })

  describe('파트너 ID 유지', () => {
    it('통합 발주서에 베트남 파트너 ID 포함', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId,
        },
      ]

      // Act
      const result = useCase.execute(recommendations, weekRange, friday, partnerId)

      // Assert
      expect(result.partnerId).toBe(partnerId)
    })
  })

  describe('거래처별 통합 발주 (executeByPartner)', () => {
    it('단일 거래처인 경우 하나의 통합 발주 생성', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId: 'partner-001',
        },
        {
          id: 'rec-002',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 200,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: tuesday,
          partnerId: 'partner-001',
        },
      ]

      // Act
      const result = useCase.executeByPartner(recommendations, weekRange, friday)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.partnerId).toBe('partner-001')
      expect(result[0]!.totalQuantity).toBe(300)
    })

    it('여러 거래처인 경우 거래처별로 통합 발주 분리', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId: 'partner-001',
        },
        {
          id: 'rec-002',
          productId: 'product-B',
          productCode: 'PRD-B',
          productName: '와이어하네스 B타입',
          quantity: 200,
          unitPrice: Money.create(2000, 'KRW'),
          recommendedDate: tuesday,
          partnerId: 'partner-002',
        },
        {
          id: 'rec-003',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 50,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: wednesday,
          partnerId: 'partner-001',
        },
      ]

      // Act
      const result = useCase.executeByPartner(recommendations, weekRange, friday)

      // Assert
      expect(result).toHaveLength(2)

      const partner1Order = result.find((o) => o.partnerId === 'partner-001')
      const partner2Order = result.find((o) => o.partnerId === 'partner-002')

      expect(partner1Order).toBeDefined()
      expect(partner1Order!.totalQuantity).toBe(150) // 100 + 50
      expect(partner1Order!.items).toHaveLength(1)

      expect(partner2Order).toBeDefined()
      expect(partner2Order!.totalQuantity).toBe(200)
      expect(partner2Order!.items).toHaveLength(1)
    })

    it('빈 권고 목록인 경우 빈 배열 반환', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = []

      // Act
      const result = useCase.executeByPartner(recommendations, weekRange, friday)

      // Assert
      expect(result).toHaveLength(0)
    })

    it('각 거래처별 발주에 올바른 금액 계산', () => {
      // Arrange
      const recommendations: OrderRecommendation[] = [
        {
          id: 'rec-001',
          productId: 'product-A',
          productCode: 'PRD-A',
          productName: '와이어하네스 A타입',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
          recommendedDate: monday,
          partnerId: 'partner-001',
        },
        {
          id: 'rec-002',
          productId: 'product-B',
          productCode: 'PRD-B',
          productName: '와이어하네스 B타입',
          quantity: 50,
          unitPrice: Money.create(3000, 'KRW'),
          recommendedDate: tuesday,
          partnerId: 'partner-002',
        },
      ]
      // partner-001: 100 x 1000 = 100,000
      // partner-002: 50 x 3000 = 150,000

      // Act
      const result = useCase.executeByPartner(recommendations, weekRange, friday)

      // Assert
      const partner1Order = result.find((o) => o.partnerId === 'partner-001')
      const partner2Order = result.find((o) => o.partnerId === 'partner-002')

      expect(partner1Order!.totalAmount.amount).toBe(100000)
      expect(partner2Order!.totalAmount.amount).toBe(150000)
    })
  })
})
