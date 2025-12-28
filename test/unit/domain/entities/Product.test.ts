import { describe, it, expect } from 'vitest'
import { Product, ProductProps } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { Money } from '@domain/valueObjects/Money'

describe('Product Entity', () => {
  const validProps: ProductProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    productCode: 'NX4-HMSL-001',
    productName: 'NX4 PE STD LPL BUILT IN',
    domesticLeadTime: 3,
    overseasLeadTime: 21,
    primarySupplier: SupplierType.DOMESTIC,
    domesticRatio: 100,
    unitPrice: Money.create(6830, 'KRW'),
    isActive: true,
  }

  describe('생성', () => {
    it('유효한 속성으로 Product 생성 성공', () => {
      const product = Product.create(validProps)

      expect(product.productCode).toBe('NX4-HMSL-001')
      expect(product.productName).toBe('NX4 PE STD LPL BUILT IN')
      expect(product.domesticLeadTime).toBe(3)
      expect(product.overseasLeadTime).toBe(21)
      expect(product.primarySupplier.value).toBe('DOMESTIC')
    })

    it('필수값 productCode 누락 시 에러', () => {
      expect(() => Product.create({ ...validProps, productCode: '' }))
        .toThrow('품번은 필수입니다')
    })

    it('필수값 productName 누락 시 에러', () => {
      expect(() => Product.create({ ...validProps, productName: '' }))
        .toThrow('품명은 필수입니다')
    })
  })

  describe('이원화 공급 설정', () => {
    it('DOMESTIC only 설정', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.DOMESTIC,
        domesticRatio: 100,
      })

      expect(product.isDomesticOnly()).toBe(true)
      expect(product.isVietnamOnly()).toBe(false)
      expect(product.isDualSourcing()).toBe(false)
    })

    it('VIETNAM only 설정', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.VIETNAM,
        domesticRatio: 0,
      })

      expect(product.isDomesticOnly()).toBe(false)
      expect(product.isVietnamOnly()).toBe(true)
      expect(product.isDualSourcing()).toBe(false)
    })

    it('BOTH 설정 (이원화)', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-partner-id',
        subPartnerId: 'vietnam-partner-id',
        domesticRatio: 70,
      })

      expect(product.isDualSourcing()).toBe(true)
      expect(product.domesticRatio).toBe(70)
      expect(product.vietnamRatio).toBe(30)
    })

    it('BOTH 설정 시 mainPartnerId 필수', () => {
      expect(() => Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
        mainPartnerId: undefined,
      })).toThrow('이원화 설정 시 국내 거래처는 필수입니다')
    })

    it('BOTH 설정 시 subPartnerId 필수', () => {
      expect(() => Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        domesticRatio: 70,
        mainPartnerId: 'domestic-id',
        subPartnerId: undefined,
      })).toThrow('이원화 설정 시 베트남 거래처는 필수입니다')
    })

    it('domesticRatio 범위 검증 (0-100)', () => {
      expect(() => Product.create({
        ...validProps,
        domesticRatio: -10,
      })).toThrow('국내 비율은 0~100 사이여야 합니다')

      expect(() => Product.create({
        ...validProps,
        domesticRatio: 150,
      })).toThrow('국내 비율은 0~100 사이여야 합니다')
    })
  })

  describe('안전재고 계수', () => {
    it('DOMESTIC 안전재고 계수 = 1.2', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.DOMESTIC,
      })
      expect(product.getSafetyStockMultiplier()).toBe(1.2)
    })

    it('VIETNAM 안전재고 계수 = 1.5', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.VIETNAM,
      })
      expect(product.getSafetyStockMultiplier()).toBe(1.5)
    })

    it('BOTH 안전재고 계수 = 1.2 (국내 기준)', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })
      expect(product.getSafetyStockMultiplier()).toBe(1.2)
    })
  })

  describe('리드타임', () => {
    it('국내 리드타임 반환', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.DOMESTIC,
      })
      expect(product.getLeadTime()).toBe(3)
    })

    it('베트남 리드타임 반환', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.VIETNAM,
      })
      expect(product.getLeadTime()).toBe(21)
    })

    it('이원화 시 국내 리드타임 반환', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })
      expect(product.getLeadTime()).toBe(3) // 국내 기준
      expect(product.getLeadTime('VIETNAM')).toBe(21)
    })
  })

  describe('분할 발주량 계산', () => {
    it('70:30 분할 시 1000개', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })

      const { domestic, vietnam } = product.splitQuantity(1000)
      expect(domestic).toBe(700)
      expect(vietnam).toBe(300)
    })

    it('반올림: 70:30 분할 시 1001개', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })

      const { domestic, vietnam } = product.splitQuantity(1001)
      expect(domestic).toBe(701) // 1001 * 0.7 = 700.7 → 701
      expect(vietnam).toBe(300) // 1001 - 701 = 300
    })

    it('DOMESTIC only면 분할 안함', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.DOMESTIC,
        domesticRatio: 100,
      })

      const { domestic, vietnam } = product.splitQuantity(1000)
      expect(domestic).toBe(1000)
      expect(vietnam).toBe(0)
    })

    it('VIETNAM only면 분할 안함', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.VIETNAM,
        domesticRatio: 0,
      })

      const { domestic, vietnam } = product.splitQuantity(1000)
      expect(domestic).toBe(0)
      expect(vietnam).toBe(1000)
    })
  })

  describe('업데이트', () => {
    it('이원화 비율 변경', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })

      const updated = product.updateDomesticRatio(80)
      expect(updated.domesticRatio).toBe(80)
      expect(updated.vietnamRatio).toBe(20)
      expect(product.domesticRatio).toBe(70) // 불변성
    })

    it('이원화 비율 변경 시 범위 검증 (음수)', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })

      expect(() => product.updateDomesticRatio(-5)).toThrow('국내 비율은 0~100 사이여야 합니다')
    })

    it('이원화 비율 변경 시 범위 검증 (100 초과)', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.BOTH,
        mainPartnerId: 'domestic-id',
        subPartnerId: 'vietnam-id',
        domesticRatio: 70,
      })

      expect(() => product.updateDomesticRatio(110)).toThrow('국내 비율은 0~100 사이여야 합니다')
    })

    it('리드타임 변경', () => {
      const product = Product.create(validProps)
      const updated = product.updateLeadTimes(5, 28)

      expect(updated.domesticLeadTime).toBe(5)
      expect(updated.overseasLeadTime).toBe(28)
    })
  })

  describe('동등성 비교 (equals)', () => {
    it('같은 ID는 동등', () => {
      const product1 = Product.create(validProps)
      const product2 = Product.create(validProps)
      expect(product1.equals(product2)).toBe(true)
    })

    it('다른 ID는 동등하지 않음', () => {
      const product1 = Product.create(validProps)
      const product2 = Product.create({
        ...validProps,
        id: 'different-id',
      })
      expect(product1.equals(product2)).toBe(false)
    })
  })

  describe('Getter 속성', () => {
    it('모든 속성 접근 가능', () => {
      const product = Product.create({
        ...validProps,
        vehicleModelId: 'vehicle-model-001',
        mainPartnerId: 'main-partner-001',
        subPartnerId: 'sub-partner-001',
      })

      expect(product.id).toBe(validProps.id)
      expect(product.productCode).toBe(validProps.productCode)
      expect(product.productName).toBe(validProps.productName)
      expect(product.vehicleModelId).toBe('vehicle-model-001')
      expect(product.domesticLeadTime).toBe(3)
      expect(product.overseasLeadTime).toBe(21)
      expect(product.primarySupplier).toBe(SupplierType.DOMESTIC)
      expect(product.mainPartnerId).toBe('main-partner-001')
      expect(product.subPartnerId).toBe('sub-partner-001')
      expect(product.isActive).toBe(true)
      expect(product.unitPrice?.amount).toBe(6830)
    })
  })

  describe('리드타임 명시적 타입 지정', () => {
    it('DOMESTIC 타입 명시적 지정', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.VIETNAM, // 기본이 베트남이어도
        domesticLeadTime: 5,
        overseasLeadTime: 25,
      })
      expect(product.getLeadTime('DOMESTIC')).toBe(5) // DOMESTIC 명시하면 국내 리드타임
    })

    it('VIETNAM 타입 명시적 지정', () => {
      const product = Product.create({
        ...validProps,
        primarySupplier: SupplierType.DOMESTIC, // 기본이 국내어도
        domesticLeadTime: 5,
        overseasLeadTime: 25,
      })
      expect(product.getLeadTime('VIETNAM')).toBe(25) // VIETNAM 명시하면 해외 리드타임
    })
  })
})
