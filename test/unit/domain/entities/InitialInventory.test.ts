/**
 * InitialInventory Entity Tests
 * TDD - RED Phase: 테스트 먼저 작성
 */

import { describe, it, expect } from 'vitest'
import { InitialInventory } from '@domain/entities/InitialInventory'

describe('InitialInventory', () => {
  const validProps = {
    id: 'test-uuid-123',
    productId: 'product-uuid-456',
    baseDate: new Date('2025-01-01'),
    quantity: 100,
    remarks: '초기 재고 설정',
    createdBy: 'user-uuid-789',
  }

  describe('create', () => {
    it('유효한 props로 InitialInventory를 생성한다', () => {
      const inventory = InitialInventory.create(validProps)

      expect(inventory.id).toBe(validProps.id)
      expect(inventory.productId).toBe(validProps.productId)
      expect(inventory.baseDate).toEqual(validProps.baseDate)
      expect(inventory.quantity).toBe(validProps.quantity)
      expect(inventory.remarks).toBe(validProps.remarks)
      expect(inventory.createdBy).toBe(validProps.createdBy)
      expect(inventory.createdAt).toBeInstanceOf(Date)
    })

    it('수량이 0인 경우에도 생성할 수 있다', () => {
      const props = { ...validProps, quantity: 0 }
      const inventory = InitialInventory.create(props)

      expect(inventory.quantity).toBe(0)
    })

    it('수량이 음수인 경우 에러를 발생시킨다', () => {
      const props = { ...validProps, quantity: -1 }

      expect(() => InitialInventory.create(props)).toThrow('수량은 0 이상이어야 합니다')
    })

    it('remarks 없이도 생성할 수 있다', () => {
      const { remarks, ...propsWithoutRemarks } = validProps
      const inventory = InitialInventory.create(propsWithoutRemarks)

      expect(inventory.remarks).toBeUndefined()
    })

    it('createdBy 없이도 생성할 수 있다', () => {
      const { createdBy, ...propsWithoutCreatedBy } = validProps
      const inventory = InitialInventory.create(propsWithoutCreatedBy)

      expect(inventory.createdBy).toBeUndefined()
    })
  })

  describe('baseDate validation', () => {
    it('과거 날짜를 기준일로 설정할 수 있다', () => {
      const props = { ...validProps, baseDate: new Date('2024-01-01') }
      const inventory = InitialInventory.create(props)

      expect(inventory.baseDate).toEqual(new Date('2024-01-01'))
    })

    it('오늘 날짜를 기준일로 설정할 수 있다', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const props = { ...validProps, baseDate: today }
      const inventory = InitialInventory.create(props)

      expect(inventory.baseDate).toEqual(today)
    })
  })

  describe('equals', () => {
    it('같은 ID를 가진 InitialInventory는 동일하다', () => {
      const inventory1 = InitialInventory.create(validProps)
      const inventory2 = InitialInventory.create({ ...validProps, quantity: 200 })

      expect(inventory1.equals(inventory2)).toBe(true)
    })

    it('다른 ID를 가진 InitialInventory는 다르다', () => {
      const inventory1 = InitialInventory.create(validProps)
      const inventory2 = InitialInventory.create({ ...validProps, id: 'different-uuid' })

      expect(inventory1.equals(inventory2)).toBe(false)
    })
  })

  describe('toPlainObject', () => {
    it('엔티티를 일반 객체로 변환한다', () => {
      const inventory = InitialInventory.create(validProps)
      const plain = inventory.toPlainObject()

      expect(plain.id).toBe(validProps.id)
      expect(plain.productId).toBe(validProps.productId)
      expect(plain.quantity).toBe(validProps.quantity)
      expect(plain).toHaveProperty('createdAt')
    })
  })
})
