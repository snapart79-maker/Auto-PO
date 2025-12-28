/**
 * CalculateMRPUseCase Unit Tests
 * MRP 계산 유즈케이스 단위 테스트
 *
 * TDD RED Phase: 테스트가 실패해야 함 (구현체 없음)
 *
 * MRP Core Formulas:
 * - Safety Stock (Domestic) = Daily Avg × Lead Time × 1.2
 * - Safety Stock (Vietnam)  = Daily Avg × Lead Time × 1.5
 * - Net Requirements = Total Requirements - Current Stock - Pending Orders + Safety Stock
 * - Reorder Point = Safety Stock + (Daily Consumption × Lead Time)
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { CalculateMRPUseCase } from '@application/usecases/CalculateMRPUseCase'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import { Product } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { DateRange } from '@domain/valueObjects/DateRange'

/**
 * MRPResult interface
 * MRP 계산 결과
 */
interface MRPResult {
  productId: string
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
}

/**
 * Mock Repository Factory
 */
function createMockProductRepository(): IProductRepository {
  return {
    findById: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findByVehicleModel: vi.fn(),
    findByPartner: vi.fn(),
    findDualSourcingProducts: vi.fn(),
    save: vi.fn(),
    saveMany: vi.fn(),
    delete: vi.fn(),
    existsByCode: vi.fn(),
  }
}

function createMockInventoryRepository(): IInventoryRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    findByDateRange: vi.fn(),
    getCurrentStock: vi.fn(),
    getStockSummaries: vi.fn(),
    getDailyAverageOutbound: vi.fn(),
    getDailyAverages: vi.fn(),
    save: vi.fn(),
    saveMany: vi.fn(),
    deleteByBatch: vi.fn(),
  }
}

function createMockOrderRepository(): IOrderRepository {
  return {
    findById: vi.fn(),
    findByOrderNumber: vi.fn(),
    findAll: vi.fn(),
    findByPartner: vi.fn(),
    findPending: vi.fn(),
    getPendingQuantity: vi.fn(),
    getPendingQuantities: vi.fn(),
    getNextSequence: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    saveLog: vi.fn(),
    findLogsByOrderId: vi.fn(),
  }
}

/**
 * Helper: Create a Product for testing
 */
function createTestProduct(
  id: string,
  name: string,
  supplierType: SupplierType,
  domesticLeadTime: number = 5,
  overseasLeadTime: number = 14
): Product {
  return Product.create({
    id,
    productCode: `CODE-${id}`,
    productName: name,
    vehicleModelId: 'vehicle-1',
    domesticLeadTime,
    overseasLeadTime,
    primarySupplier: supplierType,
    mainPartnerId: supplierType.isBoth() || supplierType.isDomestic() ? 'partner-domestic' : undefined,
    subPartnerId: supplierType.isBoth() || supplierType.isVietnam() ? 'partner-vietnam' : undefined,
    domesticRatio: supplierType.isDomestic() ? 100 : supplierType.isVietnam() ? 0 : 60,
    isActive: true,
  })
}

describe('CalculateMRPUseCase', () => {
  let useCase: CalculateMRPUseCase
  let productRepository: IProductRepository
  let inventoryRepository: IInventoryRepository
  let orderRepository: IOrderRepository
  let dateRange: DateRange

  beforeEach(() => {
    productRepository = createMockProductRepository()
    inventoryRepository = createMockInventoryRepository()
    orderRepository = createMockOrderRepository()

    // 구현체는 deps 객체를 받음
    useCase = new CalculateMRPUseCase({
      productRepository,
      inventoryRepository,
      orderRepository,
    })

    // Default date range: 30 days
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-30')
    dateRange = DateRange.create(startDate, endDate)
  })

  describe('국내 제품 MRP 계산', () => {
    it('안전재고 = 일평균 x 리드타임 x 1.2 (국내 계수)', async () => {
      // Arrange
      const productId = 'product-domestic-1'
      const dailyAverage = 100
      const leadTime = 5
      const expectedSafetyStock = 100 * 5 * 1.2 // = 600

      const product = createTestProduct(
        productId,
        '국내 제품 A',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(200)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.safetyStock).toBe(expectedSafetyStock)
    })
  })

  describe('베트남 제품 MRP 계산', () => {
    it('안전재고 = 일평균 x 리드타임 x 1.5 (베트남 계수)', async () => {
      // Arrange
      const productId = 'product-vietnam-1'
      const dailyAverage = 100
      const leadTime = 5
      const expectedSafetyStock = 100 * 5 * 1.5 // = 750

      const product = createTestProduct(
        productId,
        '베트남 제품 A',
        SupplierType.VIETNAM,
        5, // domestic lead time (unused)
        leadTime // overseas lead time
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(200)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.safetyStock).toBe(expectedSafetyStock)
    })
  })

  describe('순소요량 계산', () => {
    it('순소요량 = 총소요량 - 현재고 - 기발주량 + 안전재고', async () => {
      // Arrange
      // Formula: Net = Total - Stock - Pending + Safety
      // totalRequirement (default) = dailyAverage * leadTime = 100 * 5 = 500
      // safetyStock = dailyAverage * leadTime * 1.2 = 100 * 5 * 1.2 = 600
      // net = totalRequirement - currentStock - pendingOrders + safetyStock
      // net = 500 - 300 - 200 + 600 = 600
      const productId = 'product-net-1'
      const currentStock = 300
      const pendingOrders = 200
      const dailyAverage = 100
      const leadTime = 5
      // totalRequirement = 100 * 5 = 500
      // safetyStock = 100 * 5 * 1.2 = 600
      // net = 500 - 300 - 200 + 600 = 600
      const expectedNetRequirement = 600

      const product = createTestProduct(
        productId,
        '순소요량 테스트 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(currentStock)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(pendingOrders)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.netRequirement).toBe(expectedNetRequirement)
    })
  })

  describe('발주점 계산', () => {
    it('발주점 = 안전재고 + (일평균소비량 x 리드타임)', async () => {
      // Arrange
      // Formula: Reorder Point = Safety Stock + (Daily Consumption × Lead Time)
      // Given: safety=600, daily=100, lead=5
      // Expected: reorderPoint = 600 + (100 * 5) = 1100
      const productId = 'product-rop-1'
      const dailyAverage = 100
      const leadTime = 5
      const safetyStock = 600 // 100 * 5 * 1.2
      const expectedReorderPoint = safetyStock + dailyAverage * leadTime // = 600 + 500 = 1100

      const product = createTestProduct(
        productId,
        '발주점 테스트 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(200)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.reorderPoint).toBe(expectedReorderPoint)
    })
  })

  describe('발주 필요 여부 판단', () => {
    it('현재고가 발주점보다 높으면 needsOrder=false', async () => {
      // Arrange
      // reorderPoint = 1100, currentStock = 1500
      // Since stock > reorderPoint, needsOrder should be false
      const productId = 'product-no-order'
      const currentStock = 1500
      const dailyAverage = 100
      const leadTime = 5
      // Safety = 100 * 5 * 1.2 = 600
      // Reorder Point = 600 + 500 = 1100
      // Stock (1500) > Reorder Point (1100) -> needsOrder = false

      const product = createTestProduct(
        productId,
        '발주 불필요 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(currentStock)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(0)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.needsOrder).toBe(false)
    })

    it('현재고가 발주점보다 낮으면 needsOrder=true', async () => {
      // Arrange
      // reorderPoint = 1100, currentStock = 500
      // Since stock < reorderPoint, needsOrder should be true
      const productId = 'product-needs-order'
      const currentStock = 500
      const dailyAverage = 100
      const leadTime = 5

      const product = createTestProduct(
        productId,
        '발주 필요 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(currentStock)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(0)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.needsOrder).toBe(true)
    })
  })

  describe('추천 발주량 계산', () => {
    it('순소요량이 0 이하면 recommendedQuantity=0', async () => {
      // Arrange
      // Set up scenario where net requirement is negative or zero
      // currentStock = 2000, pending = 500, safety = 600
      // totalRequirement = dailyAverage * leadTime = 100 * 5 = 500
      // net = 500 - 2000 - 500 + 600 = -1400
      // recommendedQuantity should be 0
      const productId = 'product-zero-qty'
      const currentStock = 2000
      const pendingOrders = 500
      const dailyAverage = 100
      const leadTime = 5

      const product = createTestProduct(
        productId,
        '충분한 재고 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(currentStock)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(pendingOrders)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.recommendedQuantity).toBe(0)
    })

    it('순소요량이 양수면 recommendedQuantity=순소요량', async () => {
      // Arrange
      const productId = 'product-positive-qty'
      const currentStock = 300
      const pendingOrders = 200
      const dailyAverage = 100
      const leadTime = 5

      const product = createTestProduct(
        productId,
        '발주 필요 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(currentStock)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(pendingOrders)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      // recommendedQuantity should equal netRequirement when positive
      const netReq = results[0]?.netRequirement ?? 0
      expect(results[0]?.recommendedQuantity).toBe(netReq > 0 ? netReq : 0)
    })
  })

  describe('일평균출하량 0 처리', () => {
    it('일평균출하량 0일 때 안전재고=0, 발주점=0', async () => {
      // Arrange
      const productId = 'product-zero-daily'
      const dailyAverage = 0
      const leadTime = 5
      // Safety = 0 * 5 * 1.2 = 0
      // Reorder Point = 0 + (0 * 5) = 0

      const product = createTestProduct(
        productId,
        '출하량 없는 제품',
        SupplierType.DOMESTIC,
        leadTime
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(dailyAverage)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(0)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.safetyStock).toBe(0)
      expect(results[0]?.reorderPoint).toBe(0)
    })
  })

  describe('여러 제품 동시 계산', () => {
    it('여러 제품의 MRP를 동시에 계산한다', async () => {
      // Arrange
      const productIds = ['product-1', 'product-2', 'product-3']

      const products = [
        createTestProduct('product-1', '제품 1', SupplierType.DOMESTIC, 5),
        createTestProduct('product-2', '제품 2', SupplierType.VIETNAM, 5, 14),
        createTestProduct('product-3', '제품 3', SupplierType.DOMESTIC, 7),
      ]

      // Mock individual method calls based on productId
      ;(productRepository.findByIds as Mock).mockResolvedValue(products)
      ;(inventoryRepository.getCurrentStock as Mock).mockImplementation(async (productId: string) => {
        const stockMap: Record<string, number> = {
          'product-1': 500,
          'product-2': 800,
          'product-3': 1000,
        }
        return stockMap[productId] ?? 0
      })
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockImplementation(async (productId: string) => {
        const dailyMap: Record<string, number> = {
          'product-1': 100,
          'product-2': 50,
          'product-3': 200,
        }
        return dailyMap[productId] ?? 0
      })
      ;(orderRepository.getPendingQuantity as Mock).mockImplementation(async (productId: string) => {
        const pendingMap: Record<string, number> = {
          'product-1': 200,
          'product-2': 100,
          'product-3': 300,
        }
        return pendingMap[productId] ?? 0
      })

      // Act
      const results = await useCase.execute(productIds, dateRange)

      // Assert
      expect(results).toHaveLength(3)

      // Verify each product has its own result
      const result1 = results.find((r) => r.productId === 'product-1')
      const result2 = results.find((r) => r.productId === 'product-2')
      const result3 = results.find((r) => r.productId === 'product-3')

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result3).toBeDefined()

      // Verify different safety stock multipliers
      // Product 1 (Domestic): 100 * 5 * 1.2 = 600
      expect(result1?.safetyStock).toBe(600)
      // Product 2 (Vietnam): 50 * 14 * 1.5 = 1050
      expect(result2?.safetyStock).toBe(1050)
      // Product 3 (Domestic): 200 * 7 * 1.2 = 1680
      expect(result3?.safetyStock).toBe(1680)
    })
  })

  describe('결과 구조 검증', () => {
    it('MRPResult가 모든 필수 필드를 포함한다', async () => {
      // Arrange
      const productId = 'product-structure'
      const product = createTestProduct(
        productId,
        '구조 검증 제품',
        SupplierType.DOMESTIC,
        5
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(100)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(200)

      // Act
      const results = await useCase.execute([productId], dateRange)

      // Assert
      expect(results).toHaveLength(1)
      const result = results[0] as MRPResult

      // Check all required fields exist
      expect(result).toHaveProperty('productId')
      expect(result).toHaveProperty('productName')
      expect(result).toHaveProperty('currentStock')
      expect(result).toHaveProperty('pendingOrders')
      expect(result).toHaveProperty('dailyAverage')
      expect(result).toHaveProperty('leadTime')
      expect(result).toHaveProperty('safetyStock')
      expect(result).toHaveProperty('reorderPoint')
      expect(result).toHaveProperty('netRequirement')
      expect(result).toHaveProperty('needsOrder')
      expect(result).toHaveProperty('recommendedQuantity')

      // Verify correct types
      expect(typeof result.productId).toBe('string')
      expect(typeof result.productName).toBe('string')
      expect(typeof result.currentStock).toBe('number')
      expect(typeof result.pendingOrders).toBe('number')
      expect(typeof result.dailyAverage).toBe('number')
      expect(typeof result.leadTime).toBe('number')
      expect(typeof result.safetyStock).toBe('number')
      expect(typeof result.reorderPoint).toBe('number')
      expect(typeof result.netRequirement).toBe('number')
      expect(typeof result.needsOrder).toBe('boolean')
      expect(typeof result.recommendedQuantity).toBe('number')
    })
  })

  describe('에지 케이스', () => {
    it('제품이 없으면 빈 배열을 반환한다', async () => {
      // Arrange
      ;(productRepository.findByIds as Mock).mockResolvedValue([])

      // Act
      const results = await useCase.execute([], dateRange)

      // Assert
      expect(results).toEqual([])
    })

    it('존재하지 않는 제품 ID는 결과에서 제외된다', async () => {
      // Arrange
      const existingProductId = 'product-exists'
      const nonExistingProductId = 'product-not-exists'

      const product = createTestProduct(
        existingProductId,
        '존재하는 제품',
        SupplierType.DOMESTIC,
        5
      )

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(inventoryRepository.getCurrentStock as Mock).mockResolvedValue(500)
      ;(inventoryRepository.getDailyAverageOutbound as Mock).mockResolvedValue(100)
      ;(orderRepository.getPendingQuantity as Mock).mockResolvedValue(200)

      // Act
      const results = await useCase.execute(
        [existingProductId, nonExistingProductId],
        dateRange
      )

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]?.productId).toBe(existingProductId)
    })
  })
})
