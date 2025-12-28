/**
 * usePurchaseOrder Hook 관련 유틸 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
} from '@infrastructure/react/hooks/usePurchaseOrder'

describe('usePurchaseOrder 유틸리티', () => {
  describe('ORDER_STATUS_LABELS', () => {
    it('모든 상태에 대한 한글 레이블이 있어야 한다', () => {
      expect(ORDER_STATUS_LABELS.DRAFT).toBe('초안')
      expect(ORDER_STATUS_LABELS.CONFIRMED).toBe('확정')
      expect(ORDER_STATUS_LABELS.SENT).toBe('발송')
      expect(ORDER_STATUS_LABELS.PARTIALLY_RECEIVED).toBe('부분입고')
      expect(ORDER_STATUS_LABELS.COMPLETED).toBe('완료')
      expect(ORDER_STATUS_LABELS.CANCELLED).toBe('취소')
    })
  })

  describe('ORDER_STATUS_VARIANTS', () => {
    it('모든 상태에 대한 뱃지 variant가 있어야 한다', () => {
      expect(ORDER_STATUS_VARIANTS.DRAFT).toBe('secondary')
      expect(ORDER_STATUS_VARIANTS.CONFIRMED).toBe('default')
      expect(ORDER_STATUS_VARIANTS.SENT).toBe('default')
      expect(ORDER_STATUS_VARIANTS.PARTIALLY_RECEIVED).toBe('outline')
      expect(ORDER_STATUS_VARIANTS.COMPLETED).toBe('default')
      expect(ORDER_STATUS_VARIANTS.CANCELLED).toBe('destructive')
    })
  })

  describe('ORDER_TYPE_LABELS', () => {
    it('모든 유형에 대한 한글 레이블이 있어야 한다', () => {
      expect(ORDER_TYPE_LABELS.DOMESTIC).toBe('국내')
      expect(ORDER_TYPE_LABELS.VIETNAM).toBe('베트남')
    })
  })
})
