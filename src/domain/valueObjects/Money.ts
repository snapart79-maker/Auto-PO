/**
 * Money Value Object
 * 금액과 통화를 함께 관리하는 불변 객체
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export type Currency = 'KRW' | 'USD' | 'EUR' | 'VND'

export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: Currency
  ) {}

  get amount(): number {
    return this._amount
  }

  get currency(): Currency {
    return this._currency
  }

  /**
   * Money 객체 생성
   * @throws 금액이 음수일 경우 에러
   */
  static create(amount: number, currency: Currency): Money {
    if (amount < 0) {
      throw new Error('금액은 0 이상이어야 합니다')
    }
    return new Money(amount, currency)
  }

  /**
   * 다른 통화로 환산
   * @param targetCurrency 목표 통화
   * @param exchangeRate KRW 기준 환율 (예: USD 1400 = 1 USD = 1400 KRW)
   */
  convertTo(targetCurrency: Currency, exchangeRate: number): Money {
    if (this._currency === targetCurrency) {
      return new Money(this._amount, targetCurrency)
    }

    let amountInKRW: number

    // 현재 통화를 KRW로 변환
    if (this._currency === 'KRW') {
      amountInKRW = this._amount
    } else {
      amountInKRW = this._amount * exchangeRate
    }

    // KRW에서 목표 통화로 변환
    if (targetCurrency === 'KRW') {
      return new Money(amountInKRW, 'KRW')
    } else {
      return new Money(amountInKRW / exchangeRate, targetCurrency)
    }
  }

  /**
   * 같은 통화끼리 더하기
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other)
    return new Money(this._amount + other._amount, this._currency)
  }

  /**
   * 같은 통화끼리 빼기
   * @throws 결과가 음수일 경우 에러
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other)
    const result = this._amount - other._amount
    if (result < 0) {
      throw new Error('금액은 0 이상이어야 합니다')
    }
    return new Money(result, this._currency)
  }

  /**
   * 수량으로 곱하기
   */
  multiply(quantity: number): Money {
    if (quantity < 0) {
      throw new Error('곱하는 수는 0 이상이어야 합니다')
    }
    return new Money(this._amount * quantity, this._currency)
  }

  /**
   * 동등성 비교
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency
  }

  /**
   * 더 큰지 비교
   */
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._amount > other._amount
  }

  /**
   * 더 작은지 비교
   */
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._amount < other._amount
  }

  /**
   * 0인지 확인
   */
  isZero(): boolean {
    return this._amount === 0
  }

  /**
   * 통화에 맞는 포맷팅
   */
  format(): string {
    const formatter = this.getFormatter()
    return formatter.format(this._amount)
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error('같은 통화끼리만 연산 가능합니다')
    }
  }

  private getFormatter(): Intl.NumberFormat {
    const localeMap: Record<Currency, string> = {
      KRW: 'ko-KR',
      USD: 'en-US',
      EUR: 'de-DE',
      VND: 'vi-VN',
    }

    return new Intl.NumberFormat(localeMap[this._currency], {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: this._currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: this._currency === 'KRW' ? 0 : 2,
    })
  }
}
