import { describe, it, expect } from 'vitest'
import { SplitOrderByRatioUseCase, SplitResult } from '@application/usecases/SplitOrderByRatioUseCase'
import { Product, ProductProps } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { Money } from '@domain/valueObjects/Money'

describe('SplitOrderByRatioUseCase', () => {
  const createProduct = (overrides: Partial<ProductProps> = {}): Product => {
    const defaultProps: ProductProps = {
      id: 'test-product-id',
      productCode: 'TEST-001',
      productName: 'Test Product',
      domesticLeadTime: 3,
      overseasLeadTime: 21,
      primarySupplier: SupplierType.BOTH,
      domesticRatio: 70,
      unitPrice: Money.create(1000, 'KRW'),
      isActive: true,
      mainPartnerId: 'domestic-partner-id',
      subPartnerId: 'vietnam-partner-id',
    }
    return Product.create({ ...defaultProps, ...overrides })
  }

  const useCase = new SplitOrderByRatioUseCase()

  describe('이원화 분할 (BOTH)', () => {
    it('70:30 분할: 1000개 -> 국내 700, 베트남 300', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
      })

      const result: SplitResult = useCase.execute(product, 1000)

      expect(result.domesticQuantity).toBe(700)
      expect(result.vietnamQuantity).toBe(300)
      expect(result.domesticRatio).toBe(70)
    })

    it('반올림: 1001개 70% -> 국내 701, 베트남 300', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
      })

      const result = useCase.execute(product, 1001)

      // 1001 * 0.7 = 700.7 -> 반올림 -> 701
      expect(result.domesticQuantity).toBe(701)
      // 1001 - 701 = 300
      expect(result.vietnamQuantity).toBe(300)
      expect(result.domesticRatio).toBe(70)
    })

    it('50:50 분할: 100개 -> 국내 50, 베트남 50', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 50,
      })

      const result = useCase.execute(product, 100)

      expect(result.domesticQuantity).toBe(50)
      expect(result.vietnamQuantity).toBe(50)
      expect(result.domesticRatio).toBe(50)
    })

    it('100:0 분할 -> 베트남 0', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 100,
      })

      const result = useCase.execute(product, 500)

      expect(result.domesticQuantity).toBe(500)
      expect(result.vietnamQuantity).toBe(0)
      expect(result.domesticRatio).toBe(100)
    })

    it('0:100 분할 -> 국내 0', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 0,
        mainPartnerId: 'domestic-partner-id',
        subPartnerId: 'vietnam-partner-id',
      })

      const result = useCase.execute(product, 500)

      expect(result.domesticQuantity).toBe(0)
      expect(result.vietnamQuantity).toBe(500)
      expect(result.domesticRatio).toBe(0)
    })
  })

  describe('단일 공급처 (분할 안함)', () => {
    it('DOMESTIC only -> 전량 국내, 분할 안함', () => {
      const product = createProduct({
        primarySupplier: SupplierType.DOMESTIC,
        domesticRatio: 100,
        mainPartnerId: undefined,
        subPartnerId: undefined,
      })

      const result = useCase.execute(product, 1000)

      expect(result.domesticQuantity).toBe(1000)
      expect(result.vietnamQuantity).toBe(0)
      expect(result.domesticRatio).toBe(100)
    })

    it('VIETNAM only -> 전량 베트남, 분할 안함', () => {
      const product = createProduct({
        primarySupplier: SupplierType.VIETNAM,
        domesticRatio: 0,
        mainPartnerId: undefined,
        subPartnerId: undefined,
      })

      const result = useCase.execute(product, 1000)

      expect(result.domesticQuantity).toBe(0)
      expect(result.vietnamQuantity).toBe(1000)
      expect(result.domesticRatio).toBe(0)
    })
  })

  describe('엣지 케이스', () => {
    it('수량 0 -> 양쪽 모두 0', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
      })

      const result = useCase.execute(product, 0)

      expect(result.domesticQuantity).toBe(0)
      expect(result.vietnamQuantity).toBe(0)
      expect(result.domesticRatio).toBe(70)
    })

    it('1개 70:30 -> 국내 1, 베트남 0', () => {
      const product = createProduct({
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
      })

      const result = useCase.execute(product, 1)

      // 1 * 0.7 = 0.7 -> 반올림 -> 1
      expect(result.domesticQuantity).toBe(1)
      // 1 - 1 = 0
      expect(result.vietnamQuantity).toBe(0)
      expect(result.domesticRatio).toBe(70)
    })
  })
})
