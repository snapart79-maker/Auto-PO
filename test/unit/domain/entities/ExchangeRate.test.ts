import { describe, it, expect } from 'vitest'
import { ExchangeRate } from '@domain/entities/ExchangeRate'

describe('ExchangeRate', () => {
  const createExchangeRate = (overrides = {}) => {
    return ExchangeRate.create({
      id: 'rate-001',
      currencyCode: 'USD',
      rate: 1350.0,
      effectiveDate: new Date('2025-01-01'),
      ...overrides,
    })
  }

  describe('create', () => {
    it('should create a valid ExchangeRate', () => {
      const rate = createExchangeRate()

      expect(rate.id).toBe('rate-001')
      expect(rate.currencyCode).toBe('USD')
      expect(rate.rate).toBe(1350.0)
      expect(rate.effectiveDate.getTime()).toBe(new Date('2025-01-01').getTime())
    })

    it('should throw error when rate is zero', () => {
      expect(() => createExchangeRate({ rate: 0 })).toThrow('환율은 0보다 커야 합니다')
    })

    it('should throw error when rate is negative', () => {
      expect(() => createExchangeRate({ rate: -100 })).toThrow('환율은 0보다 커야 합니다')
    })

    it('should set createdBy if provided', () => {
      const rate = createExchangeRate({ createdBy: 'admin' })
      expect(rate.createdBy).toBe('admin')
    })

    it('should allow createdBy to be undefined', () => {
      const rate = createExchangeRate()
      expect(rate.createdBy).toBeUndefined()
    })
  })

  describe('toKRW', () => {
    it('should convert amount to KRW', () => {
      const rate = createExchangeRate({ rate: 1350.0 })
      expect(rate.toKRW(100)).toBe(135000)
    })

    it('should handle decimal amounts', () => {
      const rate = createExchangeRate({ rate: 1350.0 })
      expect(rate.toKRW(10.5)).toBe(14175)
    })
  })

  describe('fromKRW', () => {
    it('should convert KRW to foreign currency', () => {
      const rate = createExchangeRate({ rate: 1350.0 })
      expect(rate.fromKRW(135000)).toBe(100)
    })

    it('should handle decimal results', () => {
      const rate = createExchangeRate({ rate: 1350.0 })
      expect(rate.fromKRW(14175)).toBe(10.5)
    })
  })

  describe('isEffectiveAt', () => {
    it('should return true if date is after effective date', () => {
      const rate = createExchangeRate({ effectiveDate: new Date('2025-01-01') })
      expect(rate.isEffectiveAt(new Date('2025-01-15'))).toBe(true)
    })

    it('should return true if date is exactly effective date', () => {
      const rate = createExchangeRate({ effectiveDate: new Date('2025-01-01') })
      expect(rate.isEffectiveAt(new Date('2025-01-01'))).toBe(true)
    })

    it('should return false if date is before effective date', () => {
      const rate = createExchangeRate({ effectiveDate: new Date('2025-01-01') })
      expect(rate.isEffectiveAt(new Date('2024-12-31'))).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      const rate1 = createExchangeRate({ id: 'rate-001' })
      const rate2 = createExchangeRate({ id: 'rate-001', rate: 1400 })
      expect(rate1.equals(rate2)).toBe(true)
    })

    it('should return false for different id', () => {
      const rate1 = createExchangeRate({ id: 'rate-001' })
      const rate2 = createExchangeRate({ id: 'rate-002' })
      expect(rate1.equals(rate2)).toBe(false)
    })
  })
})
