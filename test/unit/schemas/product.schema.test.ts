/**
 * Product Schema Unit Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
// @ts-nocheck - Test file type checking is less strict
import { describe, it, expect } from 'vitest'

// 테스트 대상 모듈 임포트 (아직 존재하지 않음 - RED phase)
import {
  productSchema,
  productUpdateSchema,
  productBulkSchema,
  type ProductFormData,
} from '@infrastructure/schemas/product.schema'

describe('productSchema', () => {
  describe('Required Fields', () => {
    it('should require product_code', () => {
      const result = productSchema.safeParse({
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('product_code')
      }
    })

    it('should require product_name', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('product_name')
      }
    })

    it('should pass with minimum required fields', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('product_code validation', () => {
    it('should reject empty product_code', () => {
      const result = productSchema.safeParse({
        product_code: '',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('품번을 입력하세요.')
      }
    })

    it('should reject product_code longer than 50 characters', () => {
      const result = productSchema.safeParse({
        product_code: 'A'.repeat(51),
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('품번은 50자 이하여야 합니다.')
      }
    })

    it('should reject product_code with special characters', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST@001!',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('품번은 영문, 숫자, 하이픈만 가능합니다.')
      }
    })

    it('should accept valid product_code', () => {
      const validCodes = ['TEST-001', 'ABC123', 'PROD-2024-001', 'a1b2c3']

      validCodes.forEach((code) => {
        const result = productSchema.safeParse({
          product_code: code,
          product_name: '테스트 제품',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('product_name validation', () => {
    it('should reject empty product_name', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('품명을 입력하세요.')
      }
    })

    it('should reject product_name longer than 200 characters', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: 'A'.repeat(201),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('품명은 200자 이하여야 합니다.')
      }
    })

    it('should accept valid product_name including Korean', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '와이어 하네스 - 메인 배선',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('vehicle_model_id validation', () => {
    it('should accept valid UUID', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        vehicle_model_id: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        vehicle_model_id: 'invalid-uuid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('유효한 차종을 선택하세요.')
      }
    })

    it('should accept null or undefined', () => {
      const result1 = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        vehicle_model_id: null,
      })
      expect(result1.success).toBe(true)

      const result2 = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        vehicle_model_id: undefined,
      })
      expect(result2.success).toBe(true)
    })
  })

  describe('lead time validation', () => {
    it('should reject domestic_lead_time less than 1', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        domestic_lead_time: 0,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('리드타임은 1일 이상이어야 합니다.')
      }
    })

    it('should reject domestic_lead_time greater than 365', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        domestic_lead_time: 400,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('리드타임은 365일 이하여야 합니다.')
      }
    })

    it('should use default value 3 for domestic_lead_time', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.domestic_lead_time).toBe(3)
      }
    })

    it('should use default value 21 for overseas_lead_time', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overseas_lead_time).toBe(21)
      }
    })
  })

  describe('primary_supplier validation', () => {
    it('should accept valid supplier types', () => {
      const validTypes = ['DOMESTIC', 'VIETNAM', 'BOTH']

      validTypes.forEach((type) => {
        const result = productSchema.safeParse({
          product_code: 'TEST-001',
          product_name: '테스트 제품',
          primary_supplier: type,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid supplier type', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        primary_supplier: 'INVALID',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('유효한 공급처를 선택하세요.')
      }
    })

    it('should use default value DOMESTIC', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.primary_supplier).toBe('DOMESTIC')
      }
    })
  })

  describe('domestic_ratio validation', () => {
    it('should reject negative ratio', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        domestic_ratio: -10,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('비율은 0% 이상이어야 합니다.')
      }
    })

    it('should reject ratio greater than 100', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        domestic_ratio: 110,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('비율은 100% 이하여야 합니다.')
      }
    })

    it('should use default value 100', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.domestic_ratio).toBe(100)
      }
    })
  })

  describe('unit_price validation', () => {
    it('should accept positive number', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        unit_price: 1000,
      })

      expect(result.success).toBe(true)
    })

    it('should reject zero or negative', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        unit_price: 0,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('단가는 0보다 커야 합니다.')
      }
    })

    it('should accept null or undefined', () => {
      const result1 = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        unit_price: null,
      })
      expect(result1.success).toBe(true)

      const result2 = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })
      expect(result2.success).toBe(true)
    })
  })

  describe('currency validation', () => {
    it('should accept valid currencies', () => {
      const validCurrencies = ['KRW', 'USD', 'EUR', 'VND']

      validCurrencies.forEach((currency) => {
        const result = productSchema.safeParse({
          product_code: 'TEST-001',
          product_name: '테스트 제품',
          currency,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid currency', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        currency: 'GBP',
      })

      expect(result.success).toBe(false)
    })

    it('should use default value KRW', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('KRW')
      }
    })
  })

  describe('is_active validation', () => {
    it('should default to true', () => {
      const result = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('should accept boolean values', () => {
      const resultTrue = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        is_active: true,
      })
      expect(resultTrue.success).toBe(true)

      const resultFalse = productSchema.safeParse({
        product_code: 'TEST-001',
        product_name: '테스트 제품',
        is_active: false,
      })
      expect(resultFalse.success).toBe(true)
    })
  })

  describe('Full valid product', () => {
    it('should accept a complete valid product', () => {
      const result = productSchema.safeParse({
        product_code: 'WH-2024-001',
        product_name: '와이어 하네스 메인 배선',
        vehicle_model_id: '123e4567-e89b-12d3-a456-426614174000',
        domestic_lead_time: 5,
        overseas_lead_time: 30,
        primary_supplier: 'BOTH',
        main_partner_id: '123e4567-e89b-12d3-a456-426614174001',
        sub_partner_id: '123e4567-e89b-12d3-a456-426614174002',
        domestic_ratio: 60,
        unit_price: 15000,
        currency: 'KRW',
        is_active: true,
      })

      expect(result.success).toBe(true)
    })
  })
})

describe('productUpdateSchema', () => {
  it('should require id field', () => {
    const result = productUpdateSchema.safeParse({
      product_code: 'TEST-001',
      product_name: '테스트 제품',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error!.issues[0].path).toContain('id')
    }
  })

  it('should require valid UUID for id', () => {
    const result = productUpdateSchema.safeParse({
      id: 'invalid-id',
      product_code: 'TEST-001',
      product_name: '테스트 제품',
    })

    expect(result.success).toBe(false)
  })

  it('should accept valid update data', () => {
    const result = productUpdateSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      product_code: 'TEST-001',
      product_name: '수정된 제품명',
    })

    expect(result.success).toBe(true)
  })
})

describe('productBulkSchema', () => {
  it('should accept array of valid products', () => {
    const result = productBulkSchema.safeParse([
      { product_code: 'TEST-001', product_name: '제품 1' },
      { product_code: 'TEST-002', product_name: '제품 2' },
    ])

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('should reject if any item is invalid', () => {
    const result = productBulkSchema.safeParse([
      { product_code: 'TEST-001', product_name: '제품 1' },
      { product_code: '', product_name: '제품 2' }, // Invalid
    ])

    expect(result.success).toBe(false)
  })

  it('should accept empty array', () => {
    const result = productBulkSchema.safeParse([])

    expect(result.success).toBe(true)
  })
})

describe('Type inference', () => {
  it('should correctly infer ProductFormData type', () => {
    // This is a compile-time check
    const data: ProductFormData = {
      product_code: 'TEST-001',
      product_name: '테스트 제품',
      domestic_lead_time: 3,
      overseas_lead_time: 21,
      primary_supplier: 'DOMESTIC',
      domestic_ratio: 100,
      currency: 'KRW',
      is_active: true,
    }

    expect(data.product_code).toBe('TEST-001')
  })
})
