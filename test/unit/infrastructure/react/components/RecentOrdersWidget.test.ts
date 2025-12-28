/**
 * RecentOrdersWidget 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  getOrderStatusVariant,
  formatOrderDate,
  formatAmount,
} from '@infrastructure/react/components/RecentOrdersWidget'

describe('RecentOrdersWidget 유틸리티', () => {
  describe('getOrderStatusVariant', () => {
    it('DRAFT는 secondary 반환', () => {
      expect(getOrderStatusVariant('DRAFT')).toBe('secondary')
    })

    it('CONFIRMED는 default 반환', () => {
      expect(getOrderStatusVariant('CONFIRMED')).toBe('default')
    })

    it('SENT는 default 반환', () => {
      expect(getOrderStatusVariant('SENT')).toBe('default')
    })

    it('PARTIALLY_RECEIVED는 outline 반환', () => {
      expect(getOrderStatusVariant('PARTIALLY_RECEIVED')).toBe('outline')
    })

    it('COMPLETED는 default 반환', () => {
      expect(getOrderStatusVariant('COMPLETED')).toBe('default')
    })

    it('CANCELLED는 destructive 반환', () => {
      expect(getOrderStatusVariant('CANCELLED')).toBe('destructive')
    })

    it('알 수 없는 상태는 secondary 반환', () => {
      expect(getOrderStatusVariant('UNKNOWN')).toBe('secondary')
    })
  })

  describe('formatOrderDate', () => {
    it('날짜를 한국어 형식으로 포맷', () => {
      const date = new Date(2025, 0, 15) // 2025-01-15
      const formatted = formatOrderDate(date)
      expect(formatted).toContain('2025')
      expect(formatted).toContain('01')
      expect(formatted).toContain('15')
    })
  })

  describe('formatAmount', () => {
    it('금액을 원화 형식으로 포맷', () => {
      const formatted = formatAmount(1000000)
      expect(formatted).toContain('1,000,000')
      expect(formatted).toContain('₩')
    })

    it('undefined는 - 반환', () => {
      expect(formatAmount(undefined)).toBe('-')
    })

    it('0원 포맷', () => {
      const formatted = formatAmount(0)
      expect(formatted).toContain('0')
    })
  })
})
