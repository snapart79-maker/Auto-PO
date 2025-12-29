/**
 * AdjustInventoryUseCase Unit Tests
 * TDD - RED Phase: 테스트 먼저 작성
 *
 * 재고 조정 UseCase
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import {
  AdjustInventoryUseCase,
  AdjustInventoryInput,
} from '@application/usecases/AdjustInventoryUseCase'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInventoryAdjustmentRepository } from '@domain/repositories/IInventoryRepository'
import { Product } from '@domain/entities/Product'
import { InventoryAdjustment } from '@domain/entities/InventoryAdjustment'
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

describe('AdjustInventoryUseCase', () => {
  let useCase: AdjustInventoryUseCase
  let productRepository: IProductRepository
  let adjustmentRepository: IInventoryAdjustmentRepository

  beforeEach(() => {
    productRepository = createMockProductRepository()
    adjustmentRepository = createMockAdjustmentRepository()

    useCase = new AdjustInventoryUseCase({
      productRepository,
      adjustmentRepository,
    })
  })

  describe('execute', () => {
    it('재고 증가 조정을 등록한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const input: AdjustInventoryInput = {
        productId,
        adjustmentDate: new Date('2025-01-15'),
        adjustmentType: 'INCREASE',
        quantity: 50,
        reason: 'PHYSICAL_COUNT',
        remarks: '실사 결과 반영',
        createdBy: 'user-1',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)
      ;(adjustmentRepository.save as Mock).mockImplementation(async (adj) => adj)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.productId).toBe(productId)
      expect(result.adjustmentType).toBe('INCREASE')
      expect(result.quantity).toBe(50)
      expect(result.reason).toBe('PHYSICAL_COUNT')
      expect(result.isIncrease()).toBe(true)
      expect(adjustmentRepository.save).toHaveBeenCalled()
    })

    it('재고 감소 조정을 등록한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const input: AdjustInventoryInput = {
        productId,
        adjustmentDate: new Date('2025-01-15'),
        adjustmentType: 'DECREASE',
        quantity: 30,
        reason: 'DAMAGE',
        remarks: '파손 처리',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)
      ;(adjustmentRepository.save as Mock).mockImplementation(async (adj) => adj)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.adjustmentType).toBe('DECREASE')
      expect(result.reason).toBe('DAMAGE')
      expect(result.isDecrease()).toBe(true)
      expect(result.getSignedQuantity()).toBe(-30)
    })

    it('존재하지 않는 품목 ID에 대해 에러를 발생시킨다', async () => {
      // Arrange
      const input: AdjustInventoryInput = {
        productId: 'non-existing-product',
        adjustmentDate: new Date('2025-01-15'),
        adjustmentType: 'INCREASE',
        quantity: 50,
        reason: 'PHYSICAL_COUNT',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('품목을 찾을 수 없습니다')
    })

    it('수량이 0이면 에러를 발생시킨다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const input: AdjustInventoryInput = {
        productId,
        adjustmentDate: new Date('2025-01-15'),
        adjustmentType: 'INCREASE',
        quantity: 0,
        reason: 'PHYSICAL_COUNT',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('조정 수량은 0보다 커야 합니다')
    })

    it('모든 사유 타입을 지원한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')
      const reasons = ['PHYSICAL_COUNT', 'LOSS', 'DAMAGE', 'OTHER'] as const

      ;(productRepository.findById as Mock).mockResolvedValue(product)
      ;(adjustmentRepository.save as Mock).mockImplementation(async (adj) => adj)

      // Act & Assert
      for (const reason of reasons) {
        const input: AdjustInventoryInput = {
          productId,
          adjustmentDate: new Date('2025-01-15'),
          adjustmentType: 'INCREASE',
          quantity: 10,
          reason,
        }

        const result = await useCase.execute(input)
        expect(result.reason).toBe(reason)
      }
    })
  })

  describe('getAdjustmentHistory', () => {
    it('품목별 재고 조정 이력을 조회한다', async () => {
      // Arrange
      const productId = 'product-1'

      const adjustments = [
        InventoryAdjustment.create({
          id: 'adj-1',
          productId,
          adjustmentDate: new Date('2025-01-10'),
          adjustmentType: 'INCREASE',
          quantity: 50,
          reason: 'PHYSICAL_COUNT',
        }),
        InventoryAdjustment.create({
          id: 'adj-2',
          productId,
          adjustmentDate: new Date('2025-01-15'),
          adjustmentType: 'DECREASE',
          quantity: 20,
          reason: 'DAMAGE',
        }),
      ]

      ;(adjustmentRepository.findByProduct as Mock).mockResolvedValue(adjustments)

      // Act
      const results = await useCase.getAdjustmentHistory(productId)

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0]!.id).toBe('adj-1')
      expect(results[1]!.id).toBe('adj-2')
    })

    it('이력이 없으면 빈 배열을 반환한다', async () => {
      // Arrange
      ;(adjustmentRepository.findByProduct as Mock).mockResolvedValue([])

      // Act
      const results = await useCase.getAdjustmentHistory('product-with-no-history')

      // Assert
      expect(results).toEqual([])
    })
  })

  describe('getAdjustmentSummary', () => {
    it('품목별 조정 합계를 조회한다', async () => {
      // Arrange
      const productId = 'product-1'

      ;(adjustmentRepository.getAdjustmentSummary as Mock).mockResolvedValue({
        productId,
        totalIncrease: 150,
        totalDecrease: 50,
        netAdjustment: 100,
      })

      // Act
      const result = await useCase.getAdjustmentSummary(productId)

      // Assert
      expect(result.productId).toBe(productId)
      expect(result.totalIncrease).toBe(150)
      expect(result.totalDecrease).toBe(50)
      expect(result.netAdjustment).toBe(100)
    })
  })
})
