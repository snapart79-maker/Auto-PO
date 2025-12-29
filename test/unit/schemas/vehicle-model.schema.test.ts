/**
 * Vehicle Model Schema Unit Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
// @ts-nocheck - Test file type checking is less strict
import { describe, it, expect } from 'vitest'

// 테스트 대상 모듈 임포트 (아직 존재하지 않음 - RED phase)
import {
  vehicleModelSchema,
  vehicleModelUpdateSchema,
  vehicleModelBulkSchema,
  type VehicleModelFormData,
} from '@infrastructure/schemas/vehicle-model.schema'

describe('vehicleModelSchema', () => {
  describe('Required Fields', () => {
    it('should require vehicle_code', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_name: '테스트 차종',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('vehicle_code')
      }
    })

    it('should require vehicle_name', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].path).toContain('vehicle_name')
      }
    })

    it('should pass with minimum required fields', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('vehicle_code validation', () => {
    it('should reject empty vehicle_code', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: '',
        vehicle_name: '테스트 차종',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('차종 코드를 입력하세요.')
      }
    })

    it('should reject vehicle_code longer than 20 characters', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'A'.repeat(21),
        vehicle_name: '테스트 차종',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('차종 코드는 20자 이하여야 합니다.')
      }
    })

    it('should accept valid vehicle codes', () => {
      const validCodes = ['VH-001', 'AVANTE', 'SONATA-2024', 'K5']

      validCodes.forEach((code) => {
        const result = vehicleModelSchema.safeParse({
          vehicle_code: code,
          vehicle_name: '테스트 차종',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('vehicle_name validation', () => {
    it('should reject empty vehicle_name', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('차종명을 입력하세요.')
      }
    })

    it('should reject vehicle_name longer than 100 characters', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: 'A'.repeat(101),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('차종명은 100자 이하여야 합니다.')
      }
    })

    it('should accept Korean vehicle names', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '아반떼 CN7 2024년형',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('description validation', () => {
    it('should accept empty description', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
        description: null,
      })

      expect(result.success).toBe(true)
    })

    it('should accept valid description', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
        description: '이 차종에 대한 상세 설명입니다.',
      })

      expect(result.success).toBe(true)
    })

    it('should reject description longer than 500 characters', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
        description: 'A'.repeat(501),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error!.issues[0].message).toBe('설명은 500자 이하여야 합니다.')
      }
    })
  })

  describe('is_active validation', () => {
    it('should default to true', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('should accept boolean values', () => {
      const resultTrue = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
        is_active: true,
      })
      expect(resultTrue.success).toBe(true)

      const resultFalse = vehicleModelSchema.safeParse({
        vehicle_code: 'VH-001',
        vehicle_name: '테스트 차종',
        is_active: false,
      })
      expect(resultFalse.success).toBe(true)
    })
  })

  describe('Full valid vehicle model', () => {
    it('should accept a complete valid vehicle model', () => {
      const result = vehicleModelSchema.safeParse({
        vehicle_code: 'AVANTE-CN7',
        vehicle_name: '아반떼 CN7',
        description: '2020년 출시된 7세대 아반떼 모델',
        is_active: true,
      })

      expect(result.success).toBe(true)
    })
  })
})

describe('vehicleModelUpdateSchema', () => {
  it('should require id field', () => {
    const result = vehicleModelUpdateSchema.safeParse({
      vehicle_code: 'VH-001',
      vehicle_name: '테스트 차종',
    })

    expect(result.success).toBe(false)
  })

  it('should require valid UUID for id', () => {
    const result = vehicleModelUpdateSchema.safeParse({
      id: 'invalid-id',
      vehicle_code: 'VH-001',
      vehicle_name: '테스트 차종',
    })

    expect(result.success).toBe(false)
  })

  it('should accept valid update data', () => {
    const result = vehicleModelUpdateSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      vehicle_code: 'VH-001',
      vehicle_name: '수정된 차종명',
    })

    expect(result.success).toBe(true)
  })
})

describe('vehicleModelBulkSchema', () => {
  it('should accept array of valid vehicle models', () => {
    const result = vehicleModelBulkSchema.safeParse([
      { vehicle_code: 'VH-001', vehicle_name: '차종 1' },
      { vehicle_code: 'VH-002', vehicle_name: '차종 2' },
    ])

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('should reject if any item is invalid', () => {
    const result = vehicleModelBulkSchema.safeParse([
      { vehicle_code: 'VH-001', vehicle_name: '차종 1' },
      { vehicle_code: '', vehicle_name: '차종 2' }, // Invalid
    ])

    expect(result.success).toBe(false)
  })

  it('should accept empty array', () => {
    const result = vehicleModelBulkSchema.safeParse([])

    expect(result.success).toBe(true)
  })
})

describe('Type inference', () => {
  it('should correctly infer VehicleModelFormData type', () => {
    // This is a compile-time check
    const data: VehicleModelFormData = {
      vehicle_code: 'VH-001',
      vehicle_name: '테스트 차종',
      is_active: true,
    }

    expect(data.vehicle_code).toBe('VH-001')
  })
})
