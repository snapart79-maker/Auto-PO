/**
 * Quantity Value Object
 * 수량을 나타내는 불변 객체 (정수)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export class Quantity {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value
  }

  /**
   * Quantity 객체 생성
   * @param value 수량 (소수점은 반올림됨)
   * @throws 음수일 경우 에러
   */
  static create(value: number): Quantity {
    const rounded = Math.round(value)
    if (rounded < 0) {
      throw new Error('수량은 0 이상이어야 합니다')
    }
    return new Quantity(rounded)
  }

  /**
   * 더하기
   */
  add(other: Quantity): Quantity {
    return new Quantity(this._value + other._value)
  }

  /**
   * 빼기 (결과가 음수면 0 반환)
   */
  subtract(other: Quantity): Quantity {
    const result = this._value - other._value
    return new Quantity(Math.max(0, result))
  }

  /**
   * 비율로 분할 (반올림)
   * @param ratio 비율 (0-100)
   */
  splitByRatio(ratio: number): Quantity {
    const result = Math.round(this._value * (ratio / 100))
    return new Quantity(result)
  }

  /**
   * 동등성 비교
   */
  equals(other: Quantity): boolean {
    return this._value === other._value
  }

  /**
   * 크기 비교
   */
  isGreaterThan(other: Quantity): boolean {
    return this._value > other._value
  }

  isLessThan(other: Quantity): boolean {
    return this._value < other._value
  }

  isZero(): boolean {
    return this._value === 0
  }
}
