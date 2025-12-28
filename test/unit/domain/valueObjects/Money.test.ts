import { describe, it, expect } from 'vitest'
import { Money } from '@domain/valueObjects/Money'

describe('Money Value Object', () => {
  describe('생성', () => {
    it('유효한 금액과 통화로 Money 생성 성공', () => {
      const money = Money.create(1000, 'KRW')
      expect(money.amount).toBe(1000)
      expect(money.currency).toBe('KRW')
    })

    it('USD 통화로 Money 생성 성공', () => {
      const money = Money.create(100.50, 'USD')
      expect(money.amount).toBe(100.50)
      expect(money.currency).toBe('USD')
    })

    it('음수 금액은 에러 발생', () => {
      expect(() => Money.create(-100, 'KRW')).toThrow('금액은 0 이상이어야 합니다')
    })

    it('0원 생성 가능', () => {
      const money = Money.create(0, 'KRW')
      expect(money.amount).toBe(0)
    })
  })

  describe('환산 계산', () => {
    it('KRW에서 USD로 환산', () => {
      const krw = Money.create(1400000, 'KRW')
      const usd = krw.convertTo('USD', 1400)
      expect(usd.amount).toBe(1000)
      expect(usd.currency).toBe('USD')
    })

    it('USD에서 KRW로 환산', () => {
      const usd = Money.create(100, 'USD')
      const krw = usd.convertTo('KRW', 1400)
      expect(krw.amount).toBe(140000)
      expect(krw.currency).toBe('KRW')
    })
  })

  describe('연산', () => {
    it('같은 통화끼리 더하기', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(500, 'KRW')
      const result = money1.add(money2)
      expect(result.amount).toBe(1500)
    })

    it('다른 통화끼리 더하기는 에러', () => {
      const krw = Money.create(1000, 'KRW')
      const usd = Money.create(100, 'USD')
      expect(() => krw.add(usd)).toThrow('같은 통화끼리만 연산 가능합니다')
    })

    it('같은 통화끼리 빼기', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(300, 'KRW')
      const result = money1.subtract(money2)
      expect(result.amount).toBe(700)
    })

    it('곱하기 (수량 계산)', () => {
      const unitPrice = Money.create(100, 'KRW')
      const total = unitPrice.multiply(5)
      expect(total.amount).toBe(500)
    })
  })

  describe('동등성 비교', () => {
    it('같은 금액과 통화면 동등', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(1000, 'KRW')
      expect(money1.equals(money2)).toBe(true)
    })

    it('금액이 다르면 동등하지 않음', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(2000, 'KRW')
      expect(money1.equals(money2)).toBe(false)
    })

    it('통화가 다르면 동등하지 않음', () => {
      const krw = Money.create(1000, 'KRW')
      const usd = Money.create(1000, 'USD')
      expect(krw.equals(usd)).toBe(false)
    })
  })

  describe('불변성', () => {
    it('연산 후 원본 객체는 변경되지 않음', () => {
      const original = Money.create(1000, 'KRW')
      const added = original.add(Money.create(500, 'KRW'))

      expect(original.amount).toBe(1000)
      expect(added.amount).toBe(1500)
    })
  })

  describe('포맷팅', () => {
    it('KRW 포맷팅', () => {
      const money = Money.create(1234567, 'KRW')
      expect(money.format()).toBe('₩1,234,567')
    })

    it('USD 포맷팅', () => {
      const money = Money.create(1234.56, 'USD')
      expect(money.format()).toBe('$1,234.56')
    })

    it('0원 포맷팅', () => {
      const money = Money.create(0, 'KRW')
      expect(money.format()).toBe('₩0')
    })
  })

  describe('빼기 연산 에러', () => {
    it('다른 통화끼리 빼기는 에러', () => {
      const krw = Money.create(1000, 'KRW')
      const usd = Money.create(100, 'USD')
      expect(() => krw.subtract(usd)).toThrow('같은 통화끼리만 연산 가능합니다')
    })

    it('결과가 음수가 되는 빼기는 에러', () => {
      const money1 = Money.create(100, 'KRW')
      const money2 = Money.create(500, 'KRW')
      expect(() => money1.subtract(money2)).toThrow('금액은 0 이상이어야 합니다')
    })
  })

  describe('곱하기 연산 엣지 케이스', () => {
    it('0 곱하기', () => {
      const unitPrice = Money.create(100, 'KRW')
      const total = unitPrice.multiply(0)
      expect(total.amount).toBe(0)
    })

    it('소수점 곱하기', () => {
      const unitPrice = Money.create(100, 'KRW')
      const total = unitPrice.multiply(1.5)
      expect(total.amount).toBe(150)
    })

    it('음수 곱하기는 에러', () => {
      const unitPrice = Money.create(100, 'KRW')
      expect(() => unitPrice.multiply(-1)).toThrow('곱하는 수는 0 이상이어야 합니다')
    })
  })

  describe('비교 연산', () => {
    it('isGreaterThan - 더 크면 true', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(500, 'KRW')
      expect(money1.isGreaterThan(money2)).toBe(true)
    })

    it('isGreaterThan - 같으면 false', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(1000, 'KRW')
      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('isGreaterThan - 작으면 false', () => {
      const money1 = Money.create(500, 'KRW')
      const money2 = Money.create(1000, 'KRW')
      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('isLessThan - 더 작으면 true', () => {
      const money1 = Money.create(500, 'KRW')
      const money2 = Money.create(1000, 'KRW')
      expect(money1.isLessThan(money2)).toBe(true)
    })

    it('isLessThan - 같으면 false', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(1000, 'KRW')
      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('isLessThan - 더 크면 false', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(500, 'KRW')
      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('isZero - 0이면 true', () => {
      const money = Money.create(0, 'KRW')
      expect(money.isZero()).toBe(true)
    })

    it('isZero - 0이 아니면 false', () => {
      const money = Money.create(100, 'KRW')
      expect(money.isZero()).toBe(false)
    })
  })
})
