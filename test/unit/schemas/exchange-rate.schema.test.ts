/**
 * Exchange Rate Schema Tests
 * TDD: RED phase - 환율 스키마 유효성 검증 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  exchangeRateSchema,
  exchangeRateSchemaWithValidation,
  exchangeRateCurrencySchema,
} from '@infrastructure/schemas/exchange-rate.schema'

describe('exchangeRateCurrencySchema', () => {
  it('유효한 통화 코드를 허용해야 함', () => {
    const validCurrencies = ['USD', 'EUR', 'JPY', 'CNY', 'VND']

    for (const currency of validCurrencies) {
      const result = exchangeRateCurrencySchema.safeParse(currency)
      expect(result.success).toBe(true)
    }
  })

  it('KRW은 허용하지 않아야 함 (기준 통화)', () => {
    const result = exchangeRateCurrencySchema.safeParse('KRW')
    expect(result.success).toBe(false)
  })

  it('유효하지 않은 통화 코드를 거부해야 함', () => {
    const result = exchangeRateCurrencySchema.safeParse('ABC')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('지원하는 통화')
    }
  })
})

describe('exchangeRateSchema', () => {
  const validData = {
    currency_code: 'USD',
    rate: 1350,
    effective_date: new Date('2025-01-01'),
  }

  it('유효한 환율 데이터를 허용해야 함', () => {
    const result = exchangeRateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('통화 코드 누락 시 오류 반환해야 함', () => {
    const result = exchangeRateSchema.safeParse({
      ...validData,
      currency_code: undefined,
    })
    expect(result.success).toBe(false)
  })

  it('환율 0 이하 시 오류 반환해야 함', () => {
    const result = exchangeRateSchema.safeParse({
      ...validData,
      rate: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('0보다 커야')
    }
  })

  it('환율 음수 시 오류 반환해야 함', () => {
    const result = exchangeRateSchema.safeParse({
      ...validData,
      rate: -100,
    })
    expect(result.success).toBe(false)
  })

  it('적용일 필수', () => {
    const result = exchangeRateSchema.safeParse({
      ...validData,
      effective_date: undefined,
    })
    expect(result.success).toBe(false)
  })

  it('날짜 문자열을 Date로 변환해야 함 (coerce)', () => {
    const result = exchangeRateSchema.safeParse({
      ...validData,
      effective_date: '2025-01-01',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.effective_date).toBeInstanceOf(Date)
    }
  })

  it('VND 환율 소수점을 허용해야 함', () => {
    const result = exchangeRateSchema.safeParse({
      currency_code: 'VND',
      rate: 0.055,
      effective_date: new Date('2025-01-01'),
    })
    expect(result.success).toBe(true)
  })
})

describe('exchangeRateSchemaWithValidation', () => {
  it('VND 환율이 1 이상이면 경고해야 함', () => {
    const result = exchangeRateSchemaWithValidation.safeParse({
      currency_code: 'VND',
      rate: 100, // 비정상적으로 높은 VND 환율
      effective_date: new Date('2025-01-01'),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('VND 환율')
    }
  })

  it('VND 환율 0.055는 유효해야 함', () => {
    const result = exchangeRateSchemaWithValidation.safeParse({
      currency_code: 'VND',
      rate: 0.055,
      effective_date: new Date('2025-01-01'),
    })
    expect(result.success).toBe(true)
  })

  it('JPY 환율 범위 초과 시 경고해야 함', () => {
    const result = exchangeRateSchemaWithValidation.safeParse({
      currency_code: 'JPY',
      rate: 100, // 비정상적으로 높은 JPY 환율
      effective_date: new Date('2025-01-01'),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('JPY 환율')
    }
  })

  it('USD 환율 1350은 유효해야 함', () => {
    const result = exchangeRateSchemaWithValidation.safeParse({
      currency_code: 'USD',
      rate: 1350,
      effective_date: new Date('2025-01-01'),
    })
    expect(result.success).toBe(true)
  })
})
