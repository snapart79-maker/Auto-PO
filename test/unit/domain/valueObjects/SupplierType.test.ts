import { describe, it, expect } from 'vitest'
import { SupplierType } from '@domain/valueObjects/SupplierType'

describe('SupplierType Value Object', () => {
  describe('생성', () => {
    it('DOMESTIC 타입', () => {
      const type = SupplierType.DOMESTIC
      expect(type.value).toBe('DOMESTIC')
      expect(type.isDomestic()).toBe(true)
      expect(type.requiresSplit()).toBe(false)
    })

    it('VIETNAM 타입', () => {
      const type = SupplierType.VIETNAM
      expect(type.value).toBe('VIETNAM')
      expect(type.isVietnam()).toBe(true)
      expect(type.requiresSplit()).toBe(false)
    })

    it('BOTH 타입 (이원화)', () => {
      const type = SupplierType.BOTH
      expect(type.value).toBe('BOTH')
      expect(type.isBoth()).toBe(true)
      expect(type.requiresSplit()).toBe(true)
    })

    it('문자열에서 생성', () => {
      const type = SupplierType.fromString('BOTH')
      expect(type.value).toBe('BOTH')
    })

    it('잘못된 문자열은 에러', () => {
      expect(() => SupplierType.fromString('INVALID')).toThrow('유효하지 않은 공급처 유형')
    })
  })

  describe('리드타임 계수', () => {
    it('국내 안전재고 계수 = 1.2', () => {
      expect(SupplierType.DOMESTIC.safetyStockMultiplier).toBe(1.2)
    })

    it('베트남 안전재고 계수 = 1.5', () => {
      expect(SupplierType.VIETNAM.safetyStockMultiplier).toBe(1.5)
    })

    it('BOTH는 국내 계수 사용', () => {
      expect(SupplierType.BOTH.safetyStockMultiplier).toBe(1.2)
    })
  })

  describe('표시명', () => {
    it('DOMESTIC 한글명', () => {
      expect(SupplierType.DOMESTIC.displayName).toBe('국내')
    })

    it('VIETNAM 한글명', () => {
      expect(SupplierType.VIETNAM.displayName).toBe('베트남')
    })

    it('BOTH 한글명', () => {
      expect(SupplierType.BOTH.displayName).toBe('이원화')
    })
  })

  describe('동등성 비교 (equals)', () => {
    it('같은 타입이면 동등', () => {
      expect(SupplierType.DOMESTIC.equals(SupplierType.DOMESTIC)).toBe(true)
      expect(SupplierType.VIETNAM.equals(SupplierType.VIETNAM)).toBe(true)
      expect(SupplierType.BOTH.equals(SupplierType.BOTH)).toBe(true)
    })

    it('다른 타입이면 동등하지 않음', () => {
      expect(SupplierType.DOMESTIC.equals(SupplierType.VIETNAM)).toBe(false)
      expect(SupplierType.VIETNAM.equals(SupplierType.BOTH)).toBe(false)
      expect(SupplierType.DOMESTIC.equals(SupplierType.BOTH)).toBe(false)
    })

    it('fromString으로 생성한 타입은 싱글톤과 동등', () => {
      const domestic = SupplierType.fromString('DOMESTIC')
      const vietnam = SupplierType.fromString('VIETNAM')
      const both = SupplierType.fromString('BOTH')

      expect(domestic.equals(SupplierType.DOMESTIC)).toBe(true)
      expect(vietnam.equals(SupplierType.VIETNAM)).toBe(true)
      expect(both.equals(SupplierType.BOTH)).toBe(true)
    })
  })

  describe('상태 확인 메서드 조합', () => {
    it('DOMESTIC은 isDomestic만 true', () => {
      expect(SupplierType.DOMESTIC.isDomestic()).toBe(true)
      expect(SupplierType.DOMESTIC.isVietnam()).toBe(false)
      expect(SupplierType.DOMESTIC.isBoth()).toBe(false)
    })

    it('VIETNAM은 isVietnam만 true', () => {
      expect(SupplierType.VIETNAM.isDomestic()).toBe(false)
      expect(SupplierType.VIETNAM.isVietnam()).toBe(true)
      expect(SupplierType.VIETNAM.isBoth()).toBe(false)
    })

    it('BOTH는 isBoth만 true', () => {
      expect(SupplierType.BOTH.isDomestic()).toBe(false)
      expect(SupplierType.BOTH.isVietnam()).toBe(false)
      expect(SupplierType.BOTH.isBoth()).toBe(true)
    })
  })
})
