/**
 * ExchangeRate Entity
 * 환율 정보 (고정 환율 방식)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import type { Currency } from '../valueObjects/Money'

export interface ExchangeRateProps {
  id: string
  currencyCode: Currency
  rate: number // KRW 기준 환율
  effectiveDate: Date
  createdBy?: string
  createdAt?: Date
}

export class ExchangeRate {
  private constructor(private readonly props: ExchangeRateProps) {}

  get id(): string {
    return this.props.id
  }

  get currencyCode(): Currency {
    return this.props.currencyCode
  }

  get rate(): number {
    return this.props.rate
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate
  }

  get createdBy(): string | undefined {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt ?? new Date()
  }

  /**
   * ExchangeRate 생성
   */
  static create(props: ExchangeRateProps): ExchangeRate {
    if (props.rate <= 0) {
      throw new Error('환율은 0보다 커야 합니다')
    }

    return new ExchangeRate({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    })
  }

  /**
   * 금액을 KRW로 환산
   */
  toKRW(amount: number): number {
    return amount * this.props.rate
  }

  /**
   * KRW를 해당 통화로 환산
   */
  fromKRW(krwAmount: number): number {
    return krwAmount / this.props.rate
  }

  /**
   * 특정 날짜에 유효한지 확인
   */
  isEffectiveAt(date: Date): boolean {
    return this.props.effectiveDate.getTime() <= date.getTime()
  }

  equals(other: ExchangeRate): boolean {
    return this.props.id === other.props.id
  }
}
