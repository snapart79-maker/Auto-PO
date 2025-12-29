/**
 * Initial Inventory Schema Tests
 * TDD: 초기 재고 스키마 유효성 검증 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  initialInventoryRowSchema,
  initialInventoryBulkSchema,
  initialInventoryFormSchema,
  initialInventoryUploadRowSchema,
} from '@infrastructure/schemas'

describe('initialInventoryRowSchema', () => {
  it('유효한 데이터는 통과해야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      quantity: 100,
      base_date: new Date('2025-01-01'),
      remarks: '초기 재고',
    }

    const result = initialInventoryRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('품번 없으면 실패해야 함', () => {
    const invalidData = {
      product_code: '',
      quantity: 100,
      base_date: new Date('2025-01-01'),
    }

    const result = initialInventoryRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품번')
    }
  })

  it('음수 수량은 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      quantity: -10,
      base_date: new Date('2025-01-01'),
    }

    const result = initialInventoryRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('0 이상')
    }
  })

  it('0 수량은 허용해야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      quantity: 0,
      base_date: new Date('2025-01-01'),
    }

    const result = initialInventoryRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('잘못된 날짜 형식은 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      quantity: 100,
      base_date: 'invalid-date',
    }

    const result = initialInventoryRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('문자열 날짜는 Date로 변환되어야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      quantity: 100,
      base_date: '2025-01-01',
    }

    const result = initialInventoryRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.base_date).toBeInstanceOf(Date)
    }
  })

  it('비고 500자 초과 시 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      quantity: 100,
      base_date: new Date('2025-01-01'),
      remarks: 'a'.repeat(501),
    }

    const result = initialInventoryRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('500자')
    }
  })

  it('비고 없이도 통과해야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      quantity: 100,
      base_date: new Date('2025-01-01'),
    }

    const result = initialInventoryRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('initialInventoryBulkSchema', () => {
  it('빈 배열은 실패해야 함', () => {
    const result = initialInventoryBulkSchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('데이터가 없습니다')
    }
  })

  it('여러 항목 등록 가능해야 함', () => {
    const validData = [
      { product_code: 'PROD-001', quantity: 100, base_date: '2025-01-01' },
      { product_code: 'PROD-002', quantity: 200, base_date: '2025-01-01' },
      { product_code: 'PROD-003', quantity: 50, base_date: '2025-01-02' },
    ]

    const result = initialInventoryBulkSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
    }
  })

  it('하나라도 잘못된 항목이 있으면 전체 실패해야 함', () => {
    const invalidData = [
      { product_code: 'PROD-001', quantity: 100, base_date: '2025-01-01' },
      { product_code: '', quantity: 200, base_date: '2025-01-01' }, // 잘못된 항목
    ]

    const result = initialInventoryBulkSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('initialInventoryFormSchema', () => {
  it('유효한 UUID product_id 필요', () => {
    const validData = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      base_date: new Date('2025-01-01'),
      quantity: 100,
    }

    const result = initialInventoryFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('잘못된 UUID는 실패해야 함', () => {
    const invalidData = {
      product_id: 'not-a-uuid',
      base_date: new Date('2025-01-01'),
      quantity: 100,
    }

    const result = initialInventoryFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품목')
    }
  })
})

describe('initialInventoryUploadRowSchema', () => {
  it('파싱된 업로드 행 검증', () => {
    const validData = {
      rowNumber: 2,
      productCode: 'PROD-001',
      quantity: 100,
      baseDate: new Date('2025-01-01'),
      remarks: '비고',
    }

    const result = initialInventoryUploadRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('행 번호는 양수여야 함', () => {
    const invalidData = {
      rowNumber: 0,
      productCode: 'PROD-001',
      quantity: 100,
      baseDate: new Date('2025-01-01'),
    }

    const result = initialInventoryUploadRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
