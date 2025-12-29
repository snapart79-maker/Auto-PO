/**
 * Common Schema Unit Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
// @ts-nocheck - Test file type checking is less strict
import { describe, it, expect } from 'vitest'

// 테스트 대상 모듈 임포트 (아직 존재하지 않음 - RED phase)
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  currencySchema,
  dateSchema,
  positiveNumberSchema,
  percentageSchema,
  koreanTextSchema,
} from '@infrastructure/schemas/common.schema'

describe('uuidSchema', () => {
  it('should accept valid UUID', () => {
    const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000')
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID', () => {
    const result = uuidSchema.safeParse('invalid-uuid')
    expect(result.success).toBe(false)
  })

  it('should reject empty string', () => {
    const result = uuidSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('should accept valid email', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.kr',
      'user+tag@example.org',
    ]

    validEmails.forEach((email) => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid email', () => {
    const invalidEmails = [
      'invalid',
      '@nodomain.com',
      'no@',
      'spaces in@email.com',
    ]

    invalidEmails.forEach((email) => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(false)
    })
  })

  it('should provide Korean error message', () => {
    const result = emailSchema.safeParse('invalid')
    if (!result.success) {
      expect(result.error!.issues[0].message).toBe('유효한 이메일 형식을 입력하세요.')
    }
  })
})

describe('phoneSchema', () => {
  it('should accept valid Korean phone numbers', () => {
    const validPhones = [
      '010-1234-5678',
      '02-1234-5678',
      '031-123-4567',
      '01012345678',
      '0212345678',
    ]

    validPhones.forEach((phone) => {
      const result = phoneSchema.safeParse(phone)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid phone numbers', () => {
    const invalidPhones = [
      '1234',
      'abc-defg-hijk',
      '123-456-78901234',
    ]

    invalidPhones.forEach((phone) => {
      const result = phoneSchema.safeParse(phone)
      expect(result.success).toBe(false)
    })
  })
})

describe('currencySchema', () => {
  it('should accept valid currency codes', () => {
    const validCurrencies = ['KRW', 'USD', 'EUR', 'VND']

    validCurrencies.forEach((currency) => {
      const result = currencySchema.safeParse(currency)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid currency codes', () => {
    const result = currencySchema.safeParse('GBP')
    expect(result.success).toBe(false)
  })

  it('should reject lowercase', () => {
    const result = currencySchema.safeParse('krw')
    expect(result.success).toBe(false)
  })
})

describe('dateSchema', () => {
  it('should accept valid Date objects', () => {
    const result = dateSchema.safeParse(new Date())
    expect(result.success).toBe(true)
  })

  it('should accept valid date strings', () => {
    const result = dateSchema.safeParse('2024-12-29')
    expect(result.success).toBe(true)
  })

  it('should reject invalid date strings', () => {
    const result = dateSchema.safeParse('invalid-date')
    expect(result.success).toBe(false)
  })
})

describe('positiveNumberSchema', () => {
  it('should accept positive numbers', () => {
    const result = positiveNumberSchema.safeParse(100)
    expect(result.success).toBe(true)
  })

  it('should reject zero', () => {
    const result = positiveNumberSchema.safeParse(0)
    expect(result.success).toBe(false)
  })

  it('should reject negative numbers', () => {
    const result = positiveNumberSchema.safeParse(-10)
    expect(result.success).toBe(false)
  })

  it('should accept decimal numbers', () => {
    const result = positiveNumberSchema.safeParse(10.5)
    expect(result.success).toBe(true)
  })
})

describe('percentageSchema', () => {
  it('should accept values between 0 and 100', () => {
    const validValues = [0, 50, 100, 33.33]

    validValues.forEach((value) => {
      const result = percentageSchema.safeParse(value)
      expect(result.success).toBe(true)
    })
  })

  it('should reject values less than 0', () => {
    const result = percentageSchema.safeParse(-1)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error!.issues[0].message).toBe('비율은 0% 이상이어야 합니다.')
    }
  })

  it('should reject values greater than 100', () => {
    const result = percentageSchema.safeParse(101)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error!.issues[0].message).toBe('비율은 100% 이하여야 합니다.')
    }
  })
})

describe('koreanTextSchema', () => {
  it('should accept Korean text', () => {
    const result = koreanTextSchema.safeParse('안녕하세요')
    expect(result.success).toBe(true)
  })

  it('should accept mixed Korean and English', () => {
    const result = koreanTextSchema.safeParse('한글과 English')
    expect(result.success).toBe(true)
  })

  it('should accept Korean with numbers', () => {
    const result = koreanTextSchema.safeParse('제품 123호')
    expect(result.success).toBe(true)
  })

  it('should accept empty string if optional', () => {
    const result = koreanTextSchema.optional().safeParse('')
    expect(result.success).toBe(true)
  })
})
