/**
 * Inventory Adjustment Schema Tests
 * TDD: 재고 조정 스키마 유효성 검증 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  inventoryAdjustmentRowSchema,
  inventoryAdjustmentBulkSchema,
  inventoryAdjustmentFormSchema,
  inventoryAdjustmentUploadRowSchema,
  adjustmentTypeSchema,
  adjustmentReasonSchema,
} from '@infrastructure/schemas'

describe('adjustmentTypeSchema', () => {
  it('INCREASE 허용', () => {
    const result = adjustmentTypeSchema.safeParse('INCREASE')
    expect(result.success).toBe(true)
  })

  it('DECREASE 허용', () => {
    const result = adjustmentTypeSchema.safeParse('DECREASE')
    expect(result.success).toBe(true)
  })

  it('잘못된 타입은 실패', () => {
    const result = adjustmentTypeSchema.safeParse('INVALID')
    expect(result.success).toBe(false)
  })
})

describe('adjustmentReasonSchema', () => {
  it('PHYSICAL_COUNT 허용', () => {
    const result = adjustmentReasonSchema.safeParse('PHYSICAL_COUNT')
    expect(result.success).toBe(true)
  })

  it('LOSS 허용', () => {
    const result = adjustmentReasonSchema.safeParse('LOSS')
    expect(result.success).toBe(true)
  })

  it('DAMAGE 허용', () => {
    const result = adjustmentReasonSchema.safeParse('DAMAGE')
    expect(result.success).toBe(true)
  })

  it('OTHER 허용', () => {
    const result = adjustmentReasonSchema.safeParse('OTHER')
    expect(result.success).toBe(true)
  })

  it('잘못된 사유는 실패', () => {
    const result = adjustmentReasonSchema.safeParse('INVALID')
    expect(result.success).toBe(false)
  })
})

describe('inventoryAdjustmentRowSchema', () => {
  it('유효한 데이터는 통과해야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
      remarks: '실사 조정',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('품번 없으면 실패해야 함', () => {
    const invalidData = {
      product_code: '',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품번')
    }
  })

  it('0 수량은 실패해야 함 (양수 필요)', () => {
    const invalidData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 0,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('1 이상')
    }
  })

  it('음수 수량은 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'DECREASE',
      quantity: -10,
      reason: 'LOSS',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('1 이상')
    }
  })

  it('잘못된 조정 유형은 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INVALID',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('잘못된 사유는 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'INVALID',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('잘못된 날짜 형식은 실패해야 함', () => {
    const invalidData = {
      product_code: 'PROD-001',
      adjustment_date: 'not-a-date',
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('문자열 날짜는 Date로 변환되어야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      adjustment_date: '2025-01-15',
      adjustment_type: 'DECREASE',
      quantity: 30,
      reason: 'DAMAGE',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.adjustment_date).toBeInstanceOf(Date)
    }
  })

  it('비고 없이도 통과해야 함', () => {
    const validData = {
      product_code: 'PROD-001',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'OTHER',
    }

    const result = inventoryAdjustmentRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('inventoryAdjustmentBulkSchema', () => {
  it('빈 배열은 실패해야 함', () => {
    const result = inventoryAdjustmentBulkSchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('데이터가 없습니다')
    }
  })

  it('여러 항목 등록 가능해야 함', () => {
    const validData = [
      { product_code: 'PROD-001', adjustment_date: '2025-01-01', adjustment_type: 'INCREASE', quantity: 50, reason: 'PHYSICAL_COUNT' },
      { product_code: 'PROD-002', adjustment_date: '2025-01-01', adjustment_type: 'DECREASE', quantity: 10, reason: 'LOSS' },
    ]

    const result = inventoryAdjustmentBulkSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('하나라도 잘못된 항목이 있으면 전체 실패해야 함', () => {
    const invalidData = [
      { product_code: 'PROD-001', adjustment_date: '2025-01-01', adjustment_type: 'INCREASE', quantity: 50, reason: 'PHYSICAL_COUNT' },
      { product_code: '', adjustment_date: '2025-01-01', adjustment_type: 'DECREASE', quantity: 10, reason: 'LOSS' }, // 잘못된 항목
    ]

    const result = inventoryAdjustmentBulkSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('inventoryAdjustmentFormSchema', () => {
  it('유효한 UUID product_id 필요', () => {
    const validData = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('잘못된 UUID는 실패해야 함', () => {
    const invalidData = {
      product_id: 'not-a-uuid',
      adjustment_date: new Date('2025-01-01'),
      adjustment_type: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품목')
    }
  })
})

describe('inventoryAdjustmentUploadRowSchema', () => {
  it('파싱된 업로드 행 검증', () => {
    const validData = {
      rowNumber: 2,
      productCode: 'PROD-001',
      adjustmentDate: new Date('2025-01-01'),
      adjustmentType: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
      remarks: '비고',
    }

    const result = inventoryAdjustmentUploadRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('행 번호는 양수여야 함', () => {
    const invalidData = {
      rowNumber: 0,
      productCode: 'PROD-001',
      adjustmentDate: new Date('2025-01-01'),
      adjustmentType: 'INCREASE',
      quantity: 50,
      reason: 'PHYSICAL_COUNT',
    }

    const result = inventoryAdjustmentUploadRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
