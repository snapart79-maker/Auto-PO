/**
 * Partner Schema Unit Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
// @ts-nocheck - Test file type checking is less strict
import { describe, it, expect } from 'vitest'

// 테스트 대상 모듈 임포트 (아직 존재하지 않음 - RED phase)
import {
  partnerSchema,
  partnerUpdateSchema,
  partnerBulkSchema,
} from '@infrastructure/schemas/partner.schema'

describe('partnerSchema', () => {
  describe('Required Fields', () => {
    it('should require partner_code', () => {
      const result = partnerSchema.safeParse({
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('partner_code')
      }
    })

    it('should require partner_name', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('partner_name')
      }
    })

    it('should require partner_type', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('partner_type')
      }
    })

    it('should pass with minimum required fields', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('partner_code validation', () => {
    it('should reject empty partner_code', () => {
      const result = partnerSchema.safeParse({
        partner_code: '',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('거래처 코드를 입력하세요.')
      }
    })

    it('should reject partner_code longer than 20 characters', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'A'.repeat(21),
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('거래처 코드는 20자 이하여야 합니다.')
      }
    })
  })

  describe('partner_name validation', () => {
    it('should reject empty partner_name', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('거래처명을 입력하세요.')
      }
    })

    it('should reject partner_name longer than 100 characters', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: 'A'.repeat(101),
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('거래처명은 100자 이하여야 합니다.')
      }
    })
  })

  describe('partner_type validation', () => {
    it('should accept valid partner types', () => {
      const validTypes = ['SUPPLIER', 'CUSTOMER', 'VIETNAM']

      validTypes.forEach((type) => {
        const result = partnerSchema.safeParse({
          partner_code: 'P001',
          partner_name: '테스트 거래처',
          partner_type: type,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid partner type', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'INVALID',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('유효한 거래처 유형을 선택하세요.')
      }
    })
  })

  describe('business_number validation', () => {
    it('should accept valid business number format', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
        business_number: '123-45-67890',
      })

      expect(result.success).toBe(true)
    })

    it('should accept empty or null business_number', () => {
      const result1 = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
        business_number: null,
      })
      expect(result1.success).toBe(true)

      const result2 = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })
      expect(result2.success).toBe(true)
    })
  })

  describe('contact_email validation', () => {
    it('should accept valid email', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
        contact_email: 'test@example.com',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
        contact_email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('유효한 이메일 형식을 입력하세요.')
      }
    })

    it('should accept null or empty email', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
        contact_email: null,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('currency validation', () => {
    it('should default to KRW', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('KRW')
      }
    })

    it('should accept valid currencies', () => {
      const validCurrencies = ['KRW', 'USD', 'EUR', 'VND']

      validCurrencies.forEach((currency) => {
        const result = partnerSchema.safeParse({
          partner_code: 'P001',
          partner_name: '테스트 거래처',
          partner_type: 'SUPPLIER',
          currency,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('is_active validation', () => {
    it('should default to true', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'P001',
        partner_name: '테스트 거래처',
        partner_type: 'SUPPLIER',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })
  })

  describe('Full valid partner', () => {
    it('should accept a complete valid partner', () => {
      const result = partnerSchema.safeParse({
        partner_code: 'SUP-001',
        partner_name: '경림테크 주식회사',
        partner_type: 'SUPPLIER',
        business_number: '123-45-67890',
        address: '경기도 화성시 동탄면',
        contact_person: '홍길동',
        contact_phone: '031-123-4567',
        contact_email: 'hong@example.com',
        currency: 'KRW',
        is_active: true,
      })

      expect(result.success).toBe(true)
    })
  })
})

describe('partnerUpdateSchema', () => {
  it('should require id field', () => {
    const result = partnerUpdateSchema.safeParse({
      partner_code: 'P001',
      partner_name: '테스트 거래처',
      partner_type: 'SUPPLIER',
    })

    expect(result.success).toBe(false)
  })

  it('should accept valid update data', () => {
    const result = partnerUpdateSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      partner_code: 'P001',
      partner_name: '수정된 거래처명',
      partner_type: 'SUPPLIER',
    })

    expect(result.success).toBe(true)
  })
})

describe('partnerBulkSchema', () => {
  it('should accept array of valid partners', () => {
    const result = partnerBulkSchema.safeParse([
      { partner_code: 'P001', partner_name: '거래처 1', partner_type: 'SUPPLIER' },
      { partner_code: 'P002', partner_name: '거래처 2', partner_type: 'CUSTOMER' },
    ])

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('should reject if any item is invalid', () => {
    const result = partnerBulkSchema.safeParse([
      { partner_code: 'P001', partner_name: '거래처 1', partner_type: 'SUPPLIER' },
      { partner_code: '', partner_name: '거래처 2', partner_type: 'SUPPLIER' }, // Invalid
    ])

    expect(result.success).toBe(false)
  })
})
