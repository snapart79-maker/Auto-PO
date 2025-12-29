/**
 * CalculateCurrentStockUseCase Unit Tests
 * TDD - RED Phase: 테스트 먼저 작성
 *
 * 현재고 계산 UseCase
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { CalculateCurrentStockUseCase } from '@application/usecases/CalculateCurrentStockUseCase'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInitialInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IInventoryRepository } from '@domain/repositories/IInventoryRepository'
import type { IInventoryAdjustmentRepository } from '@domain/repositories/IInventoryRepository'
import { Product } from '@domain/entities/Product'
import { InitialInventory } from '@domain/entities/InitialInventory'
// InventoryAdjustment is used via mocks
import { StockStatus } from '@domain/entities/CurrentInventory'
import { SupplierType } from '@domain/valueObjects/SupplierType'

// Mock Repository Factory
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

function createMockInitialInventoryRepository(): IInitialInventoryRepository {
  return {
    findById: vi.fn(),
    findByProductAndDate: vi.fn(),
    findLatestByProduct: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    saveMany: vi.fn(),
    delete: vi.fn(),
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

function createMockAdjustmentRepository(): IInventoryAdjustmentRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    findByProduct: vi.fn(),
    findByDateRange: vi.fn(),
    getAdjustmentSummary: vi.fn(),
    getAdjustmentSummaries: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  }
}

// Helper: Create Test Product
function createTestProduct(id: string, name: string): Product {
  return Product.create({
    id,
    productCode: `CODE-${id}`,
    productName: name,
    vehicleModelId: 'vehicle-1',
    domesticLeadTime: 5,
    overseasLeadTime: 14,
    primarySupplier: SupplierType.DOMESTIC,
    mainPartnerId: 'partner-domestic',
    domesticRatio: 100,
    isActive: true,
  })
}

describe('CalculateCurrentStockUseCase', () => {
  let useCase: CalculateCurrentStockUseCase
  let productRepository: IProductRepository
  let initialInventoryRepository: IInitialInventoryRepository
  let inventoryRepository: IInventoryRepository
  let adjustmentRepository: IInventoryAdjustmentRepository

  beforeEach(() => {
    productRepository = createMockProductRepository()
    initialInventoryRepository = createMockInitialInventoryRepository()
    inventoryRepository = createMockInventoryRepository()
    adjustmentRepository = createMockAdjustmentRepository()

    useCase = new CalculateCurrentStockUseCase({
      productRepository,
      initialInventoryRepository,
      inventoryRepository,
      adjustmentRepository,
    })
  })

  describe('execute', () => {
    it('단일 제품의 현재고를 계산한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const initialInventory = InitialInventory.create({
        id: 'init-1',
        productId,
        baseDate: new Date('2025-01-01'),
        quantity: 100,
      })

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockResolvedValue(initialInventory)
      ;(inventoryRepository.getStockSummaries as Mock).mockResolvedValue([
        { productId, currentStock: 0, lastTransactionDate: null }, // 임시값
      ])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId,
        totalIncrease: 50,
        totalDecrease: 20,
        netAdjustment: 30,
      })

      // Mock 입고/출고 합계를 위해 inventoryRepository 확장
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([
        { transactionType: 'IN', quantity: 500 },
        { transactionType: 'OUT', quantity: 300 },
      ])

      // Act
      const results = await useCase.execute([productId])

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]!.productId).toBe(productId)
      // 현재고 = 초기(100) + 입고(500) - 출고(300) + 조정(30) = 330
      expect(results[0]!.currentQty).toBe(330)
    })

    it('여러 제품의 현재고를 일괄 계산한다', async () => {
      // Arrange
      const productIds = ['product-1', 'product-2']
      const products = [
        createTestProduct('product-1', '제품 A'),
        createTestProduct('product-2', '제품 B'),
      ]

      ;(productRepository.findByIds as Mock).mockResolvedValue(products)
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockImplementation(
        async (id: string) => {
          return InitialInventory.create({
            id: `init-${id}`,
            productId: id,
            baseDate: new Date('2025-01-01'),
            quantity: id === 'product-1' ? 100 : 200,
          })
        }
      )
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId: 'any',
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      })

      // Act
      const results = await useCase.execute(productIds)

      // Assert
      expect(results).toHaveLength(2)
      expect(results.find((r) => r.productId === 'product-1')).toBeDefined()
      expect(results.find((r) => r.productId === 'product-2')).toBeDefined()
    })

    it('초기재고가 없는 제품은 0으로 계산한다', async () => {
      // Arrange
      const productId = 'product-no-init'
      const product = createTestProduct(productId, '초기재고 없는 제품')

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockResolvedValue(null)
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([
        { transactionType: 'IN', quantity: 100 },
        { transactionType: 'OUT', quantity: 50 },
      ])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId,
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      })

      // Act
      const results = await useCase.execute([productId])

      // Assert
      expect(results).toHaveLength(1)
      // 현재고 = 0 + 100 - 50 + 0 = 50
      expect(results[0]!.currentQty).toBe(50)
    })

    it('재고 상태가 포함된 결과를 반환한다', async () => {
      // Arrange
      const productId = 'product-with-status'
      const product = createTestProduct(productId, '상태 포함 제품')

      ;(productRepository.findByIds as Mock).mockResolvedValue([product])
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockResolvedValue(
        InitialInventory.create({
          id: 'init-1',
          productId,
          baseDate: new Date('2025-01-01'),
          quantity: 50,
        })
      )
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId,
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      })

      // Act
      const results = await useCase.execute([productId])

      // Assert
      expect(results).toHaveLength(1)
      // safetyStock = 0 이므로 현재고가 있으면 NORMAL
      expect(results[0]!.getStockStatus()).toBe(StockStatus.NORMAL)
      expect(results[0]!.currentQty).toBe(50)
    })

    it('빈 제품 ID 배열이면 빈 결과를 반환한다', async () => {
      // Arrange
      ;(productRepository.findByIds as Mock).mockResolvedValue([])

      // Act
      const results = await useCase.execute([])

      // Assert
      expect(results).toEqual([])
    })

    it('존재하지 않는 제품은 결과에서 제외된다', async () => {
      // Arrange
      const existingProduct = createTestProduct('existing', '존재하는 제품')

      ;(productRepository.findByIds as Mock).mockResolvedValue([existingProduct])
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockResolvedValue(null)
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId: 'existing',
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      })

      // Act
      const results = await useCase.execute(['existing', 'non-existing'])

      // Assert
      expect(results).toHaveLength(1)
      expect(results[0]!.productId).toBe('existing')
    })
  })

  describe('executeForAll', () => {
    it('모든 활성 제품의 현재고를 계산한다', async () => {
      // Arrange
      const products = [
        createTestProduct('product-1', '제품 A'),
        createTestProduct('product-2', '제품 B'),
      ]

      ;(productRepository.findAll as Mock).mockResolvedValue(products)
      ;(productRepository.findByIds as Mock).mockResolvedValue(products)
      ;(initialInventoryRepository.findLatestByProduct as Mock).mockResolvedValue(null)
      ;(inventoryRepository.findAll as Mock).mockResolvedValue([])
      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId: 'any',
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      })

      // Act
      const results = await useCase.executeForAll()

      // Assert
      expect(results).toHaveLength(2)
    })
  })
})
