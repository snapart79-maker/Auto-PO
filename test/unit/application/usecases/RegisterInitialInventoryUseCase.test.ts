/**
 * RegisterInitialInventoryUseCase Unit Tests
 * TDD - RED Phase: 테스트 먼저 작성
 *
 * 초기재고 등록 UseCase
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import {
  RegisterInitialInventoryUseCase,
  RegisterInitialInventoryInput,
} from '@application/usecases/RegisterInitialInventoryUseCase'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInitialInventoryRepository } from '@domain/repositories/IInventoryRepository'
import { Product } from '@domain/entities/Product'
import { InitialInventory } from '@domain/entities/InitialInventory'
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

describe('RegisterInitialInventoryUseCase', () => {
  let useCase: RegisterInitialInventoryUseCase
  let productRepository: IProductRepository
  let initialInventoryRepository: IInitialInventoryRepository

  beforeEach(() => {
    productRepository = createMockProductRepository()
    initialInventoryRepository = createMockInitialInventoryRepository()

    useCase = new RegisterInitialInventoryUseCase({
      productRepository,
      initialInventoryRepository,
    })
  })

  describe('execute', () => {
    it('단일 초기재고를 등록한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const input: RegisterInitialInventoryInput = {
        productId,
        baseDate: new Date('2025-01-01'),
        quantity: 100,
        remarks: '초기 재고 등록',
        createdBy: 'user-1',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)
      ;(initialInventoryRepository.findByProductAndDate as Mock).mockResolvedValue(null)
      ;(initialInventoryRepository.save as Mock).mockImplementation(async (inv) => inv)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.productId).toBe(productId)
      expect(result.quantity).toBe(100)
      expect(result.remarks).toBe('초기 재고 등록')
      expect(initialInventoryRepository.save).toHaveBeenCalled()
    })

    it('존재하지 않는 품목 ID에 대해 에러를 발생시킨다', async () => {
      // Arrange
      const input: RegisterInitialInventoryInput = {
        productId: 'non-existing-product',
        baseDate: new Date('2025-01-01'),
        quantity: 100,
      }

      ;(productRepository.findById as Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('품목을 찾을 수 없습니다')
    })

    it('기존 초기재고가 있으면 업데이트한다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')
      const baseDate = new Date('2025-01-01')

      const existingInventory = InitialInventory.create({
        id: 'existing-inv-1',
        productId,
        baseDate,
        quantity: 50,
      })

      const input: RegisterInitialInventoryInput = {
        productId,
        baseDate,
        quantity: 100, // 업데이트할 수량
        remarks: '수량 수정',
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)
      ;(initialInventoryRepository.findByProductAndDate as Mock).mockResolvedValue(existingInventory)
      ;(initialInventoryRepository.save as Mock).mockImplementation(async (inv) => inv)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe('existing-inv-1') // 기존 ID 유지
      expect(result.quantity).toBe(100) // 새 수량
      expect(initialInventoryRepository.save).toHaveBeenCalled()
    })

    it('수량이 음수면 에러를 발생시킨다', async () => {
      // Arrange
      const productId = 'product-1'
      const product = createTestProduct(productId, '테스트 제품')

      const input: RegisterInitialInventoryInput = {
        productId,
        baseDate: new Date('2025-01-01'),
        quantity: -10, // 음수
      }

      ;(productRepository.findById as Mock).mockResolvedValue(product)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('수량은 0 이상이어야 합니다')
    })
  })

  describe('executeMany', () => {
    it('일괄 초기재고를 등록한다', async () => {
      // Arrange
      const products = [
        createTestProduct('product-1', '제품 A'),
        createTestProduct('product-2', '제품 B'),
      ]

      const inputs: RegisterInitialInventoryInput[] = [
        { productId: 'product-1', baseDate: new Date('2025-01-01'), quantity: 100 },
        { productId: 'product-2', baseDate: new Date('2025-01-01'), quantity: 200 },
      ]

      ;(productRepository.findById as Mock).mockImplementation(async (id: string) => {
        return products.find((p) => p.id === id) || null
      })
      ;(initialInventoryRepository.findByProductAndDate as Mock).mockResolvedValue(null)
      ;(initialInventoryRepository.saveMany as Mock).mockImplementation(async (invs) => invs)

      // Act
      const results = await useCase.executeMany(inputs)

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0]!.productId).toBe('product-1')
      expect(results[1]!.productId).toBe('product-2')
    })

    it('일부 품목이 없으면 해당 항목만 에러를 수집한다', async () => {
      // Arrange
      const product = createTestProduct('product-1', '제품 A')

      const inputs: RegisterInitialInventoryInput[] = [
        { productId: 'product-1', baseDate: new Date('2025-01-01'), quantity: 100 },
        { productId: 'non-existing', baseDate: new Date('2025-01-01'), quantity: 200 },
      ]

      ;(productRepository.findById as Mock).mockImplementation(async (id: string) => {
        return id === 'product-1' ? product : null
      })
      ;(initialInventoryRepository.findByProductAndDate as Mock).mockResolvedValue(null)
      ;(initialInventoryRepository.saveMany as Mock).mockImplementation(async (invs) => invs)

      // Act
      const results = await useCase.executeMany(inputs)

      // Assert
      // 성공한 것만 반환
      expect(results).toHaveLength(1)
      expect(results[0]!.productId).toBe('product-1')
    })

    it('빈 배열이면 빈 결과를 반환한다', async () => {
      // Act
      const results = await useCase.executeMany([])

      // Assert
      expect(results).toEqual([])
    })
  })
})
