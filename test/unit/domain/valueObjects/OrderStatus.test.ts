import { describe, it, expect } from 'vitest'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'

describe('OrderStatus Value Object', () => {
  describe('상태 생성', () => {
    it('DRAFT 상태', () => {
      const status = OrderStatus.DRAFT
      expect(status.value).toBe('DRAFT')
      expect(status.isDraft()).toBe(true)
    })

    it('CONFIRMED 상태', () => {
      const status = OrderStatus.CONFIRMED
      expect(status.value).toBe('CONFIRMED')
      expect(status.isConfirmed()).toBe(true)
    })

    it('SENT 상태', () => {
      const status = OrderStatus.SENT
      expect(status.value).toBe('SENT')
      expect(status.isSent()).toBe(true)
    })

    it('PARTIALLY_RECEIVED 상태', () => {
      const status = OrderStatus.PARTIALLY_RECEIVED
      expect(status.value).toBe('PARTIALLY_RECEIVED')
    })

    it('COMPLETED 상태', () => {
      const status = OrderStatus.COMPLETED
      expect(status.value).toBe('COMPLETED')
    })

    it('CANCELLED 상태', () => {
      const status = OrderStatus.CANCELLED
      expect(status.value).toBe('CANCELLED')
    })
  })

  describe('문자열에서 생성 (fromString)', () => {
    it('DRAFT 문자열에서 생성', () => {
      const status = OrderStatus.fromString('DRAFT')
      expect(status.value).toBe('DRAFT')
      expect(status).toBe(OrderStatus.DRAFT)
    })

    it('CONFIRMED 문자열에서 생성', () => {
      const status = OrderStatus.fromString('CONFIRMED')
      expect(status.value).toBe('CONFIRMED')
      expect(status).toBe(OrderStatus.CONFIRMED)
    })

    it('SENT 문자열에서 생성', () => {
      const status = OrderStatus.fromString('SENT')
      expect(status.value).toBe('SENT')
      expect(status).toBe(OrderStatus.SENT)
    })

    it('PARTIALLY_RECEIVED 문자열에서 생성', () => {
      const status = OrderStatus.fromString('PARTIALLY_RECEIVED')
      expect(status.value).toBe('PARTIALLY_RECEIVED')
      expect(status).toBe(OrderStatus.PARTIALLY_RECEIVED)
    })

    it('COMPLETED 문자열에서 생성', () => {
      const status = OrderStatus.fromString('COMPLETED')
      expect(status.value).toBe('COMPLETED')
      expect(status).toBe(OrderStatus.COMPLETED)
    })

    it('CANCELLED 문자열에서 생성', () => {
      const status = OrderStatus.fromString('CANCELLED')
      expect(status.value).toBe('CANCELLED')
      expect(status).toBe(OrderStatus.CANCELLED)
    })

    it('유효하지 않은 문자열에서 생성 시 에러', () => {
      expect(() => OrderStatus.fromString('INVALID')).toThrow('유효하지 않은 발주 상태: INVALID')
    })

    it('빈 문자열에서 생성 시 에러', () => {
      expect(() => OrderStatus.fromString('')).toThrow('유효하지 않은 발주 상태: ')
    })
  })

  describe('상태 전이 가능 여부', () => {
    it('DRAFT → CONFIRMED 가능', () => {
      expect(OrderStatus.DRAFT.canTransitionTo(OrderStatus.CONFIRMED)).toBe(true)
    })

    it('DRAFT → CANCELLED 가능', () => {
      expect(OrderStatus.DRAFT.canTransitionTo(OrderStatus.CANCELLED)).toBe(true)
    })

    it('CONFIRMED → SENT 가능', () => {
      expect(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.SENT)).toBe(true)
    })

    it('SENT → PARTIALLY_RECEIVED 가능', () => {
      expect(OrderStatus.SENT.canTransitionTo(OrderStatus.PARTIALLY_RECEIVED)).toBe(true)
    })

    it('SENT → COMPLETED 가능', () => {
      expect(OrderStatus.SENT.canTransitionTo(OrderStatus.COMPLETED)).toBe(true)
    })

    it('COMPLETED → 다른 상태 불가', () => {
      expect(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.DRAFT)).toBe(false)
      expect(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.CANCELLED)).toBe(false)
    })

    it('CANCELLED → 다른 상태 불가', () => {
      expect(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.DRAFT)).toBe(false)
    })
  })

  describe('편의 메서드', () => {
    it('편집 가능 여부', () => {
      expect(OrderStatus.DRAFT.isEditable()).toBe(true)
      expect(OrderStatus.CONFIRMED.isEditable()).toBe(false)
      expect(OrderStatus.SENT.isEditable()).toBe(false)
    })

    it('완료 상태 여부', () => {
      expect(OrderStatus.COMPLETED.isFinal()).toBe(true)
      expect(OrderStatus.CANCELLED.isFinal()).toBe(true)
      expect(OrderStatus.SENT.isFinal()).toBe(false)
    })
  })

  describe('표시명', () => {
    it('한글 상태명', () => {
      expect(OrderStatus.DRAFT.displayName).toBe('초안')
      expect(OrderStatus.CONFIRMED.displayName).toBe('확정')
      expect(OrderStatus.SENT.displayName).toBe('발송')
      expect(OrderStatus.PARTIALLY_RECEIVED.displayName).toBe('부분입고')
      expect(OrderStatus.COMPLETED.displayName).toBe('완료')
      expect(OrderStatus.CANCELLED.displayName).toBe('취소')
    })
  })

  describe('동등성 비교 (equals)', () => {
    it('같은 상태는 동등', () => {
      expect(OrderStatus.DRAFT.equals(OrderStatus.DRAFT)).toBe(true)
      expect(OrderStatus.CONFIRMED.equals(OrderStatus.CONFIRMED)).toBe(true)
      expect(OrderStatus.SENT.equals(OrderStatus.SENT)).toBe(true)
    })

    it('다른 상태는 동등하지 않음', () => {
      expect(OrderStatus.DRAFT.equals(OrderStatus.CONFIRMED)).toBe(false)
      expect(OrderStatus.CONFIRMED.equals(OrderStatus.SENT)).toBe(false)
      expect(OrderStatus.COMPLETED.equals(OrderStatus.CANCELLED)).toBe(false)
    })

    it('fromString으로 생성한 상태는 싱글톤과 동등', () => {
      const status = OrderStatus.fromString('DRAFT')
      expect(status.equals(OrderStatus.DRAFT)).toBe(true)
    })
  })

  describe('상태 확인 메서드 추가', () => {
    it('isDraft는 DRAFT에서만 true', () => {
      expect(OrderStatus.DRAFT.isDraft()).toBe(true)
      expect(OrderStatus.CONFIRMED.isDraft()).toBe(false)
      expect(OrderStatus.SENT.isDraft()).toBe(false)
      expect(OrderStatus.COMPLETED.isDraft()).toBe(false)
    })

    it('isConfirmed는 CONFIRMED에서만 true', () => {
      expect(OrderStatus.CONFIRMED.isConfirmed()).toBe(true)
      expect(OrderStatus.DRAFT.isConfirmed()).toBe(false)
      expect(OrderStatus.SENT.isConfirmed()).toBe(false)
    })

    it('isSent는 SENT에서만 true', () => {
      expect(OrderStatus.SENT.isSent()).toBe(true)
      expect(OrderStatus.DRAFT.isSent()).toBe(false)
      expect(OrderStatus.CONFIRMED.isSent()).toBe(false)
      expect(OrderStatus.COMPLETED.isSent()).toBe(false)
    })

    it('isEditable는 DRAFT에서만 true', () => {
      expect(OrderStatus.DRAFT.isEditable()).toBe(true)
      expect(OrderStatus.CONFIRMED.isEditable()).toBe(false)
      expect(OrderStatus.COMPLETED.isEditable()).toBe(false)
      expect(OrderStatus.CANCELLED.isEditable()).toBe(false)
    })

    it('isFinal은 COMPLETED와 CANCELLED에서만 true', () => {
      expect(OrderStatus.COMPLETED.isFinal()).toBe(true)
      expect(OrderStatus.CANCELLED.isFinal()).toBe(true)
      expect(OrderStatus.DRAFT.isFinal()).toBe(false)
      expect(OrderStatus.CONFIRMED.isFinal()).toBe(false)
      expect(OrderStatus.PARTIALLY_RECEIVED.isFinal()).toBe(false)
    })
  })
})
