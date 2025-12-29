/**
 * InventoryAdjustment Entity Tests
 * TDD - RED Phase: 테스트 먼저 작성
 */

import { describe, it, expect } from 'vitest'
import {
  InventoryAdjustment,
  AdjustmentType,
  AdjustmentReason,
} from '@domain/entities/InventoryAdjustment'

describe('InventoryAdjustment', () => {
  const validIncreaseProps = {
    id: 'adj-uuid-123',
    adjustmentDate: new Date('2025-01-15'),
    productId: 'product-uuid-456',
    adjustmentType: 'INCREASE' as AdjustmentType,
    quantity: 50,
    reason: 'PHYSICAL_COUNT' as AdjustmentReason,
    remarks: '실사 결과 반영',
    createdBy: 'user-uuid-789',
  }

  const validDecreaseProps = {
    ...validIncreaseProps,
    id: 'adj-uuid-456',
    adjustmentType: 'DECREASE' as AdjustmentType,
    reason: 'DAMAGE' as AdjustmentReason,
    remarks: '파손 처리',
  }

  describe('create', () => {
    it('INCREASE 타입으로 재고 조정을 생성한다', () => {
      const adjustment = InventoryAdjustment.create(validIncreaseProps)

      expect(adjustment.id).toBe(validIncreaseProps.id)
      expect(adjustment.adjustmentType).toBe('INCREASE')
      expect(adjustment.quantity).toBe(50)
      expect(adjustment.reason).toBe('PHYSICAL_COUNT')
    })

    it('DECREASE 타입으로 재고 조정을 생성한다', () => {
      const adjustment = InventoryAdjustment.create(validDecreaseProps)

      expect(adjustment.adjustmentType).toBe('DECREASE')
      expect(adjustment.reason).toBe('DAMAGE')
    })

    it('수량이 0인 경우 에러를 발생시킨다', () => {
      const props = { ...validIncreaseProps, quantity: 0 }

      expect(() => InventoryAdjustment.create(props)).toThrow('조정 수량은 0보다 커야 합니다')
    })

    it('수량이 음수인 경우 에러를 발생시킨다', () => {
      const props = { ...validIncreaseProps, quantity: -10 }

      expect(() => InventoryAdjustment.create(props)).toThrow('조정 수량은 0보다 커야 합니다')
    })

    it('모든 사유 타입을 지원한다', () => {
      const reasons: AdjustmentReason[] = ['PHYSICAL_COUNT', 'LOSS', 'DAMAGE', 'OTHER']

      reasons.forEach((reason) => {
        const props = { ...validIncreaseProps, reason }
        const adjustment = InventoryAdjustment.create(props)
        expect(adjustment.reason).toBe(reason)
      })
    })

    it('모든 getter를 통해 속성에 접근할 수 있다', () => {
      const adjustment = InventoryAdjustment.create(validIncreaseProps)

      expect(adjustment.remarks).toBe(validIncreaseProps.remarks)
      expect(adjustment.createdBy).toBe(validIncreaseProps.createdBy)
      expect(adjustment.createdAt).toBeInstanceOf(Date)
      expect(adjustment.adjustmentDate).toEqual(validIncreaseProps.adjustmentDate)
      expect(adjustment.productId).toBe(validIncreaseProps.productId)
    })

    it('remarks와 createdBy 없이도 생성할 수 있다', () => {
      const { remarks, createdBy, ...propsWithoutOptional } = validIncreaseProps
      const adjustment = InventoryAdjustment.create(propsWithoutOptional)

      expect(adjustment.remarks).toBeUndefined()
      expect(adjustment.createdBy).toBeUndefined()
    })
  })

  describe('isIncrease / isDecrease', () => {
    it('INCREASE 타입일 때 isIncrease()가 true를 반환한다', () => {
      const adjustment = InventoryAdjustment.create(validIncreaseProps)

      expect(adjustment.isIncrease()).toBe(true)
      expect(adjustment.isDecrease()).toBe(false)
    })

    it('DECREASE 타입일 때 isDecrease()가 true를 반환한다', () => {
      const adjustment = InventoryAdjustment.create(validDecreaseProps)

      expect(adjustment.isIncrease()).toBe(false)
      expect(adjustment.isDecrease()).toBe(true)
    })
  })

  describe('getSignedQuantity', () => {
    it('INCREASE 타입일 때 양수를 반환한다', () => {
      const adjustment = InventoryAdjustment.create(validIncreaseProps)

      expect(adjustment.getSignedQuantity()).toBe(50)
    })

    it('DECREASE 타입일 때 음수를 반환한다', () => {
      const adjustment = InventoryAdjustment.create(validDecreaseProps)

      expect(adjustment.getSignedQuantity()).toBe(-50)
    })
  })

  describe('equals', () => {
    it('같은 ID를 가진 조정은 동일하다', () => {
      const adj1 = InventoryAdjustment.create(validIncreaseProps)
      const adj2 = InventoryAdjustment.create({ ...validIncreaseProps, quantity: 100 })

      expect(adj1.equals(adj2)).toBe(true)
    })

    it('다른 ID를 가진 조정은 다르다', () => {
      const adj1 = InventoryAdjustment.create(validIncreaseProps)
      const adj2 = InventoryAdjustment.create(validDecreaseProps)

      expect(adj1.equals(adj2)).toBe(false)
    })
  })

  describe('getReasonLabel', () => {
    it('사유 코드에 해당하는 한글 라벨을 반환한다', () => {
      const testCases: { reason: AdjustmentReason; expected: string }[] = [
        { reason: 'PHYSICAL_COUNT', expected: '실사' },
        { reason: 'LOSS', expected: '분실' },
        { reason: 'DAMAGE', expected: '파손' },
        { reason: 'OTHER', expected: '기타' },
      ]

      testCases.forEach(({ reason, expected }) => {
        const props = { ...validIncreaseProps, reason }
        const adjustment = InventoryAdjustment.create(props)
        expect(adjustment.getReasonLabel()).toBe(expected)
      })
    })
  })

  describe('toPlainObject', () => {
    it('엔티티를 일반 객체로 변환한다', () => {
      const adjustment = InventoryAdjustment.create(validIncreaseProps)
      const plain = adjustment.toPlainObject()

      expect(plain.id).toBe(validIncreaseProps.id)
      expect(plain.adjustmentType).toBe('INCREASE')
      expect(plain.quantity).toBe(50)
      expect(plain.reason).toBe('PHYSICAL_COUNT')
    })
  })
})
