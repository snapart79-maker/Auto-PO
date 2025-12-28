import { describe, it, expect } from 'vitest'
import { Partner, PartnerProps } from '@domain/entities/Partner'
import { PartnerType } from '@domain/valueObjects/PartnerType'

describe('Partner Entity', () => {
  const validProps: PartnerProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    partnerCode: 'SUP001',
    partnerName: '(주)엠에스파트너스',
    partnerType: PartnerType.SUPPLIER,
    currency: 'KRW',
    isActive: true,
  }

  describe('생성', () => {
    it('유효한 속성으로 Partner 생성 성공', () => {
      const partner = Partner.create(validProps)

      expect(partner.id).toBe(validProps.id)
      expect(partner.partnerCode).toBe('SUP001')
      expect(partner.partnerName).toBe('(주)엠에스파트너스')
      expect(partner.partnerType.value).toBe('SUPPLIER')
      expect(partner.currency).toBe('KRW')
      expect(partner.isActive).toBe(true)
    })

    it('선택적 필드 포함하여 생성', () => {
      const partner = Partner.create({
        ...validProps,
        businessNumber: '123-45-67890',
        address: '서울시 강남구',
        contactPerson: '홍길동',
        contactPhone: '010-1234-5678',
        contactEmail: 'hong@example.com',
      })

      expect(partner.businessNumber).toBe('123-45-67890')
      expect(partner.address).toBe('서울시 강남구')
      expect(partner.contactPerson).toBe('홍길동')
    })

    it('필수값 partnerCode 누락 시 에러', () => {
      const invalidProps = { ...validProps, partnerCode: '' }
      expect(() => Partner.create(invalidProps)).toThrow('거래처 코드는 필수입니다')
    })

    it('필수값 partnerName 누락 시 에러', () => {
      const invalidProps = { ...validProps, partnerName: '' }
      expect(() => Partner.create(invalidProps)).toThrow('거래처명은 필수입니다')
    })
  })

  describe('타입 확인', () => {
    it('SUPPLIER 타입 확인', () => {
      const supplier = Partner.create({
        ...validProps,
        partnerType: PartnerType.SUPPLIER,
      })
      expect(supplier.isSupplier()).toBe(true)
      expect(supplier.isCustomer()).toBe(false)
      expect(supplier.isVietnam()).toBe(false)
    })

    it('CUSTOMER 타입 확인', () => {
      const customer = Partner.create({
        ...validProps,
        partnerType: PartnerType.CUSTOMER,
      })
      expect(customer.isSupplier()).toBe(false)
      expect(customer.isCustomer()).toBe(true)
    })

    it('VIETNAM 타입 확인', () => {
      const vietnam = Partner.create({
        ...validProps,
        partnerType: PartnerType.VIETNAM,
      })
      expect(vietnam.isVietnam()).toBe(true)
    })
  })

  describe('업데이트', () => {
    it('이름 변경', () => {
      const partner = Partner.create(validProps)
      const updated = partner.updateName('새로운 회사명')

      expect(updated.partnerName).toBe('새로운 회사명')
      expect(partner.partnerName).toBe('(주)엠에스파트너스') // 불변성
    })

    it('연락처 정보 변경', () => {
      const partner = Partner.create(validProps)
      const updated = partner.updateContact({
        contactPerson: '김철수',
        contactPhone: '010-9999-8888',
        contactEmail: 'kim@example.com',
      })

      expect(updated.contactPerson).toBe('김철수')
      expect(updated.contactPhone).toBe('010-9999-8888')
    })

    it('비활성화', () => {
      const partner = Partner.create(validProps)
      const deactivated = partner.deactivate()

      expect(deactivated.isActive).toBe(false)
      expect(partner.isActive).toBe(true) // 불변성
    })

    it('활성화', () => {
      const partner = Partner.create({ ...validProps, isActive: false })
      const activated = partner.activate()

      expect(activated.isActive).toBe(true)
      expect(partner.isActive).toBe(false) // 불변성
    })

    it('활성화 후 비활성화', () => {
      const partner = Partner.create({ ...validProps, isActive: false })
      const activated = partner.activate()
      const deactivated = activated.deactivate()

      expect(deactivated.isActive).toBe(false)
    })
  })

  describe('동등성', () => {
    it('같은 ID면 동등', () => {
      const partner1 = Partner.create(validProps)
      const partner2 = Partner.create({ ...validProps, partnerName: '다른이름' })

      expect(partner1.equals(partner2)).toBe(true)
    })

    it('다른 ID면 동등하지 않음', () => {
      const partner1 = Partner.create(validProps)
      const partner2 = Partner.create({
        ...validProps,
        id: '999e4567-e89b-12d3-a456-426614174999',
      })

      expect(partner1.equals(partner2)).toBe(false)
    })
  })
})
