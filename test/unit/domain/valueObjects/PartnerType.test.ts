import { describe, it, expect } from 'vitest'
import { PartnerType } from '@domain/valueObjects/PartnerType'

describe('PartnerType Value Object', () => {
  describe('생성', () => {
    it('SUPPLIER 타입 생성', () => {
      const type = PartnerType.SUPPLIER
      expect(type.value).toBe('SUPPLIER')
      expect(type.isSupplier()).toBe(true)
    })

    it('CUSTOMER 타입 생성', () => {
      const type = PartnerType.CUSTOMER
      expect(type.value).toBe('CUSTOMER')
      expect(type.isCustomer()).toBe(true)
    })

    it('VIETNAM 타입 생성', () => {
      const type = PartnerType.VIETNAM
      expect(type.value).toBe('VIETNAM')
      expect(type.isVietnam()).toBe(true)
    })

    it('문자열에서 생성', () => {
      const type = PartnerType.fromString('SUPPLIER')
      expect(type.value).toBe('SUPPLIER')
    })

    it('잘못된 문자열은 에러', () => {
      expect(() => PartnerType.fromString('INVALID')).toThrow('유효하지 않은 거래처 유형')
    })
  })

  describe('표시명', () => {
    it('SUPPLIER 한글명', () => {
      expect(PartnerType.SUPPLIER.displayName).toBe('협력사')
    })

    it('CUSTOMER 한글명', () => {
      expect(PartnerType.CUSTOMER.displayName).toBe('고객사')
    })

    it('VIETNAM 한글명', () => {
      expect(PartnerType.VIETNAM.displayName).toBe('베트남')
    })
  })

  describe('동등성', () => {
    it('같은 타입이면 동등', () => {
      const type1 = PartnerType.SUPPLIER
      const type2 = PartnerType.fromString('SUPPLIER')
      expect(type1.equals(type2)).toBe(true)
    })

    it('다른 타입이면 동등하지 않음', () => {
      expect(PartnerType.SUPPLIER.equals(PartnerType.CUSTOMER)).toBe(false)
    })
  })
})
