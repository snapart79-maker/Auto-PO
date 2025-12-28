import { describe, it, expect } from 'vitest'
import { Company, CompanyProps } from '@domain/entities/Company'

describe('Company Entity', () => {
  const validProps: CompanyProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    companyNameKr: '경림테크(주)',
    companyNameEn: 'Kyungrim Tech Co., Ltd.',
    ceoName: '홍길동',
    businessNumber: '123-45-67890',
    addressKr: '경기도 화성시 동탄순환대로 123',
    addressEn: '123 Dongtan Sunhwan-daero, Hwaseong-si, Gyeonggi-do',
    phone: '031-000-0000',
    fax: '031-000-0001',
    isActive: true,
  }

  describe('생성', () => {
    it('유효한 속성으로 Company 생성 성공', () => {
      const company = Company.create(validProps)

      expect(company.companyNameKr).toBe('경림테크(주)')
      expect(company.companyNameEn).toBe('Kyungrim Tech Co., Ltd.')
      expect(company.ceoName).toBe('홍길동')
      expect(company.businessNumber).toBe('123-45-67890')
    })

    it('필수값 companyNameKr 누락 시 에러', () => {
      expect(() => Company.create({ ...validProps, companyNameKr: '' }))
        .toThrow('회사명(국문)은 필수입니다')
    })

    it('필수값 ceoName 누락 시 에러', () => {
      expect(() => Company.create({ ...validProps, ceoName: '' }))
        .toThrow('대표이사명은 필수입니다')
    })

    it('필수값 businessNumber 누락 시 에러', () => {
      expect(() => Company.create({ ...validProps, businessNumber: '' }))
        .toThrow('사업자등록번호는 필수입니다')
    })

    it('필수값 addressKr 누락 시 에러', () => {
      expect(() => Company.create({ ...validProps, addressKr: '' }))
        .toThrow('주소(국문)는 필수입니다')
    })
  })

  describe('업데이트', () => {
    it('대표이사 변경', () => {
      const company = Company.create(validProps)
      const updated = company.updateCeo('김철수')

      expect(updated.ceoName).toBe('김철수')
      expect(company.ceoName).toBe('홍길동') // 불변성
    })

    it('연락처 변경', () => {
      const company = Company.create(validProps)
      const updated = company.updateContact('031-111-1111', '031-111-1112')

      expect(updated.phone).toBe('031-111-1111')
      expect(updated.fax).toBe('031-111-1112')
    })

    it('주소 변경', () => {
      const company = Company.create(validProps)
      const updated = company.updateAddress('새 주소', 'New Address')

      expect(updated.addressKr).toBe('새 주소')
      expect(updated.addressEn).toBe('New Address')
    })
  })

  describe('발주서 헤더 정보', () => {
    it('국문 발주서 헤더', () => {
      const company = Company.create(validProps)
      const header = company.getOrderHeaderKr()

      expect(header.companyName).toBe('경림테크(주)')
      expect(header.ceoName).toBe('홍길동')
      expect(header.businessNumber).toBe('123-45-67890')
      expect(header.address).toBe('경기도 화성시 동탄순환대로 123')
    })

    it('영문 발주서 헤더', () => {
      const company = Company.create(validProps)
      const header = company.getOrderHeaderEn()

      expect(header.companyName).toBe('Kyungrim Tech Co., Ltd.')
      expect(header.address).toBe('123 Dongtan Sunhwan-daero, Hwaseong-si, Gyeonggi-do')
    })

    it('영문 헤더 - 영문 이름 없을 때 국문 사용', () => {
      const company = Company.create({ ...validProps, companyNameEn: undefined, addressEn: undefined })
      const header = company.getOrderHeaderEn()

      expect(header.companyName).toBe('경림테크(주)')
      expect(header.address).toBe('경기도 화성시 동탄순환대로 123')
    })

    it('헤더에 전화번호와 팩스 포함', () => {
      const company = Company.create(validProps)
      const header = company.getOrderHeaderKr()

      expect(header.phone).toBe('031-000-0000')
      expect(header.fax).toBe('031-000-0001')
    })
  })

  describe('동등성 비교 (equals)', () => {
    it('같은 ID면 동등', () => {
      const company1 = Company.create(validProps)
      const company2 = Company.create(validProps)
      expect(company1.equals(company2)).toBe(true)
    })

    it('다른 ID면 동등하지 않음', () => {
      const company1 = Company.create(validProps)
      const company2 = Company.create({
        ...validProps,
        id: 'different-id',
      })
      expect(company1.equals(company2)).toBe(false)
    })
  })

  describe('Getter 속성', () => {
    it('모든 속성 접근 가능', () => {
      const company = Company.create(validProps)

      expect(company.id).toBe(validProps.id)
      expect(company.companyNameKr).toBe('경림테크(주)')
      expect(company.companyNameEn).toBe('Kyungrim Tech Co., Ltd.')
      expect(company.ceoName).toBe('홍길동')
      expect(company.businessNumber).toBe('123-45-67890')
      expect(company.addressKr).toBe('경기도 화성시 동탄순환대로 123')
      expect(company.addressEn).toBe('123 Dongtan Sunhwan-daero, Hwaseong-si, Gyeonggi-do')
      expect(company.phone).toBe('031-000-0000')
      expect(company.fax).toBe('031-000-0001')
      expect(company.isActive).toBe(true)
    })

    it('선택적 속성이 없을 때', () => {
      const company = Company.create({
        ...validProps,
        companyNameEn: undefined,
        addressEn: undefined,
        phone: undefined,
        fax: undefined,
      })

      expect(company.companyNameEn).toBeUndefined()
      expect(company.addressEn).toBeUndefined()
      expect(company.phone).toBeUndefined()
      expect(company.fax).toBeUndefined()
    })
  })
})
