import { describe, it, expect } from 'vitest'
import { Quantity } from '@domain/valueObjects/Quantity'

describe('Quantity Value Object', () => {
  describe('생성', () => {
    it('양수 수량 생성 성공', () => {
      const qty = Quantity.create(100)
      expect(qty.value).toBe(100)
    })

    it('0 수량 생성 가능', () => {
      const qty = Quantity.create(0)
      expect(qty.value).toBe(0)
    })

    it('음수 수량은 에러 발생', () => {
      expect(() => Quantity.create(-10)).toThrow('수량은 0 이상이어야 합니다')
    })

    it('소수점 수량은 반올림', () => {
      const qty = Quantity.create(10.6)
      expect(qty.value).toBe(11)
    })
  })

  describe('연산', () => {
    it('더하기', () => {
      const qty1 = Quantity.create(100)
      const qty2 = Quantity.create(50)
      const result = qty1.add(qty2)
      expect(result.value).toBe(150)
    })

    it('빼기', () => {
      const qty1 = Quantity.create(100)
      const qty2 = Quantity.create(30)
      const result = qty1.subtract(qty2)
      expect(result.value).toBe(70)
    })

    it('빼기 결과가 음수면 0 반환', () => {
      const qty1 = Quantity.create(50)
      const qty2 = Quantity.create(100)
      const result = qty1.subtract(qty2)
      expect(result.value).toBe(0)
    })

    it('비율로 분할 (반올림)', () => {
      const total = Quantity.create(1000)
      const domestic = total.splitByRatio(70) // 70%
      expect(domestic.value).toBe(700)
    })

    it('비율로 분할 (반올림 케이스)', () => {
      const total = Quantity.create(1001)
      const domestic = total.splitByRatio(70)
      expect(domestic.value).toBe(701) // 1001 * 0.7 = 700.7 → 701
    })
  })

  describe('비교', () => {
    it('같은 수량이면 동등', () => {
      const qty1 = Quantity.create(100)
      const qty2 = Quantity.create(100)
      expect(qty1.equals(qty2)).toBe(true)
    })

    it('크기 비교', () => {
      const qty1 = Quantity.create(100)
      const qty2 = Quantity.create(50)
      expect(qty1.isGreaterThan(qty2)).toBe(true)
      expect(qty2.isLessThan(qty1)).toBe(true)
    })

    it('0인지 확인', () => {
      const zero = Quantity.create(0)
      const nonZero = Quantity.create(10)
      expect(zero.isZero()).toBe(true)
      expect(nonZero.isZero()).toBe(false)
    })
  })

  describe('불변성', () => {
    it('연산 후 원본 불변', () => {
      const original = Quantity.create(100)
      const added = original.add(Quantity.create(50))

      expect(original.value).toBe(100)
      expect(added.value).toBe(150)
    })
  })
})
