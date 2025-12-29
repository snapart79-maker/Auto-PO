/**
 * Shipment Plan Schema Tests
 * TDD: 출하 계획 스키마 유효성 검증 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  shipmentPlanRowSchema,
  shipmentPlanBulkSchema,
  shipmentPlanFormSchema,
  shipmentPlanUploadRowSchema,
  planTypeSchema,
} from '@infrastructure/schemas'

describe('planTypeSchema', () => {
  it('DAILY 허용', () => {
    const result = planTypeSchema.safeParse('DAILY')
    expect(result.success).toBe(true)
  })

  it('WEEKLY 허용', () => {
    const result = planTypeSchema.safeParse('WEEKLY')
    expect(result.success).toBe(true)
  })

  it('MONTHLY 허용', () => {
    const result = planTypeSchema.safeParse('MONTHLY')
    expect(result.success).toBe(true)
  })

  it('YEARLY 허용', () => {
    const result = planTypeSchema.safeParse('YEARLY')
    expect(result.success).toBe(true)
  })

  it('잘못된 타입은 실패', () => {
    const result = planTypeSchema.safeParse('INVALID')
    expect(result.success).toBe(false)
  })
})

describe('shipmentPlanRowSchema', () => {
  it('유효한 데이터는 통과해야 함', () => {
    const validData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('거래처코드 없으면 실패해야 함', () => {
    const invalidData = {
      partner_code: '',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('거래처코드')
    }
  })

  it('품번 없으면 실패해야 함', () => {
    const invalidData = {
      partner_code: 'P001',
      product_code: '',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품번')
    }
  })

  it('0 수량은 실패해야 함 (양수 필요)', () => {
    const invalidData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 0,
    }

    const result = shipmentPlanRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('1 이상')
    }
  })

  it('음수 수량은 실패해야 함', () => {
    const invalidData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: -10,
    }

    const result = shipmentPlanRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('잘못된 날짜 형식은 실패해야 함', () => {
    const invalidData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: 'not-a-date',
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('문자열 날짜는 Date로 변환되어야 함', () => {
    const validData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: '2025-01-15',
      plan_type: 'WEEKLY',
      planned_quantity: 200,
    }

    const result = shipmentPlanRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plan_date).toBeInstanceOf(Date)
    }
  })

  it('plan_type 기본값은 DAILY여야 함', () => {
    const validData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: '2025-01-15',
      planned_quantity: 100,
    }

    const result = shipmentPlanRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plan_type).toBe('DAILY')
    }
  })

  it('차종코드는 선택 사항이어야 함', () => {
    const validData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
      vehicle_model_code: 'VM001',
    }

    const result = shipmentPlanRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('차종코드 없이도 통과해야 함', () => {
    const validData = {
      partner_code: 'P001',
      product_code: 'PROD-001',
      plan_date: new Date('2025-01-01'),
      plan_type: 'MONTHLY',
      planned_quantity: 500,
    }

    const result = shipmentPlanRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('shipmentPlanBulkSchema', () => {
  it('빈 배열은 실패해야 함', () => {
    const result = shipmentPlanBulkSchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('데이터가 없습니다')
    }
  })

  it('여러 항목 등록 가능해야 함', () => {
    const validData = [
      { partner_code: 'P001', product_code: 'PROD-001', plan_date: '2025-01-01', plan_type: 'DAILY', planned_quantity: 100 },
      { partner_code: 'P002', product_code: 'PROD-002', plan_date: '2025-01-02', plan_type: 'WEEKLY', planned_quantity: 200 },
      { partner_code: 'P001', product_code: 'PROD-003', plan_date: '2025-01-03', plan_type: 'MONTHLY', planned_quantity: 500 },
    ]

    const result = shipmentPlanBulkSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
    }
  })

  it('하나라도 잘못된 항목이 있으면 전체 실패해야 함', () => {
    const invalidData = [
      { partner_code: 'P001', product_code: 'PROD-001', plan_date: '2025-01-01', plan_type: 'DAILY', planned_quantity: 100 },
      { partner_code: '', product_code: 'PROD-002', plan_date: '2025-01-02', plan_type: 'WEEKLY', planned_quantity: 200 }, // 잘못된 항목
    ]

    const result = shipmentPlanBulkSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('shipmentPlanFormSchema', () => {
  it('유효한 UUID들 필요', () => {
    const validData = {
      partner_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '223e4567-e89b-12d3-a456-426614174000',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('잘못된 거래처 UUID는 실패해야 함', () => {
    const invalidData = {
      partner_id: 'not-a-uuid',
      product_id: '223e4567-e89b-12d3-a456-426614174000',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('거래처')
    }
  })

  it('잘못된 품목 UUID는 실패해야 함', () => {
    const invalidData = {
      partner_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: 'not-a-uuid',
      plan_date: new Date('2025-01-01'),
      plan_type: 'DAILY',
      planned_quantity: 100,
    }

    const result = shipmentPlanFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('품목')
    }
  })

  it('차종 UUID는 선택 사항이어야 함', () => {
    const validData = {
      partner_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '223e4567-e89b-12d3-a456-426614174000',
      plan_date: new Date('2025-01-01'),
      plan_type: 'WEEKLY',
      planned_quantity: 200,
      vehicle_model_id: '323e4567-e89b-12d3-a456-426614174000',
    }

    const result = shipmentPlanFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})

describe('shipmentPlanUploadRowSchema', () => {
  it('파싱된 업로드 행 검증', () => {
    const validData = {
      rowNumber: 2,
      partnerCode: 'P001',
      productCode: 'PROD-001',
      planDate: new Date('2025-01-01'),
      planType: 'DAILY',
      plannedQuantity: 100,
    }

    const result = shipmentPlanUploadRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('행 번호는 양수여야 함', () => {
    const invalidData = {
      rowNumber: 0,
      partnerCode: 'P001',
      productCode: 'PROD-001',
      planDate: new Date('2025-01-01'),
      planType: 'DAILY',
      plannedQuantity: 100,
    }

    const result = shipmentPlanUploadRowSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('차종코드는 선택 사항이어야 함', () => {
    const validData = {
      rowNumber: 2,
      partnerCode: 'P001',
      productCode: 'PROD-001',
      planDate: new Date('2025-01-01'),
      planType: 'WEEKLY',
      plannedQuantity: 200,
      vehicleModelCode: 'VM001',
    }

    const result = shipmentPlanUploadRowSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
