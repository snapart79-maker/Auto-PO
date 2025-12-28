/**
 * MRPSummaryWidget 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  getSupplierBadgeVariant,
  SUPPLIER_TYPE_LABELS,
  formatQuantity,
  getStockRiskLevel,
  getRiskColorClass,
} from '@infrastructure/react/components/MRPSummaryWidget'

describe('MRPSummaryWidget 유틸리티', () => {
  describe('getSupplierBadgeVariant', () => {
    it('DOMESTIC은 default 반환', () => {
      expect(getSupplierBadgeVariant('DOMESTIC')).toBe('default')
    })

    it('VIETNAM은 secondary 반환', () => {
      expect(getSupplierBadgeVariant('VIETNAM')).toBe('secondary')
    })

    it('BOTH는 outline 반환', () => {
      expect(getSupplierBadgeVariant('BOTH')).toBe('outline')
    })

    it('알 수 없는 타입은 default 반환', () => {
      expect(getSupplierBadgeVariant('UNKNOWN')).toBe('default')
    })
  })

  describe('SUPPLIER_TYPE_LABELS', () => {
    it('공급처 타입 라벨이 정의되어야 한다', () => {
      expect(SUPPLIER_TYPE_LABELS.DOMESTIC).toBe('국내')
      expect(SUPPLIER_TYPE_LABELS.VIETNAM).toBe('베트남')
      expect(SUPPLIER_TYPE_LABELS.BOTH).toBe('국내/베트남')
    })
  })

  describe('formatQuantity', () => {
    it('숫자를 천 단위 포맷', () => {
      expect(formatQuantity(1000)).toBe('1,000')
      expect(formatQuantity(1234567)).toBe('1,234,567')
    })

    it('0 값 포맷', () => {
      expect(formatQuantity(0)).toBe('0')
    })
  })

  describe('getStockRiskLevel', () => {
    it('재고율 30% 미만은 critical', () => {
      expect(getStockRiskLevel(20, 100)).toBe('critical')
      expect(getStockRiskLevel(0, 100)).toBe('critical')
    })

    it('재고율 30-70%는 warning', () => {
      expect(getStockRiskLevel(30, 100)).toBe('warning')
      expect(getStockRiskLevel(50, 100)).toBe('warning')
      expect(getStockRiskLevel(69, 100)).toBe('warning')
    })

    it('재고율 70% 이상은 normal', () => {
      expect(getStockRiskLevel(70, 100)).toBe('normal')
      expect(getStockRiskLevel(100, 100)).toBe('normal')
    })
  })

  describe('getRiskColorClass', () => {
    it('critical은 red 클래스 반환', () => {
      const result = getRiskColorClass('critical')
      expect(result).toContain('red')
    })

    it('warning은 orange 클래스 반환', () => {
      const result = getRiskColorClass('warning')
      expect(result).toContain('orange')
    })

    it('normal은 yellow 클래스 반환', () => {
      const result = getRiskColorClass('normal')
      expect(result).toContain('yellow')
    })
  })
})
