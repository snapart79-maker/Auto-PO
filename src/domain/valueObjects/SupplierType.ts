/**
 * SupplierType Value Object
 * 공급처 유형: DOMESTIC (국내), VIETNAM (베트남), BOTH (이원화)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

type SupplierTypeValue = 'DOMESTIC' | 'VIETNAM' | 'BOTH'

const DISPLAY_NAMES: Record<SupplierTypeValue, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
  BOTH: '이원화',
}

// 안전재고 계수: 국내 1.2, 베트남 1.5
const SAFETY_STOCK_MULTIPLIERS: Record<SupplierTypeValue, number> = {
  DOMESTIC: 1.2,
  VIETNAM: 1.5,
  BOTH: 1.2, // BOTH는 국내 기준 사용
}

export class SupplierType {
  private constructor(private readonly _value: SupplierTypeValue) {}

  get value(): SupplierTypeValue {
    return this._value
  }

  get displayName(): string {
    return DISPLAY_NAMES[this._value]
  }

  get safetyStockMultiplier(): number {
    return SAFETY_STOCK_MULTIPLIERS[this._value]
  }

  // Singleton instances
  static readonly DOMESTIC = new SupplierType('DOMESTIC')
  static readonly VIETNAM = new SupplierType('VIETNAM')
  static readonly BOTH = new SupplierType('BOTH')

  /**
   * 문자열에서 SupplierType 생성
   */
  static fromString(value: string): SupplierType {
    switch (value) {
      case 'DOMESTIC':
        return SupplierType.DOMESTIC
      case 'VIETNAM':
        return SupplierType.VIETNAM
      case 'BOTH':
        return SupplierType.BOTH
      default:
        throw new Error(`유효하지 않은 공급처 유형: ${value}`)
    }
  }

  isDomestic(): boolean {
    return this._value === 'DOMESTIC'
  }

  isVietnam(): boolean {
    return this._value === 'VIETNAM'
  }

  isBoth(): boolean {
    return this._value === 'BOTH'
  }

  /**
   * 이원화 분할이 필요한지 여부
   */
  requiresSplit(): boolean {
    return this._value === 'BOTH'
  }

  equals(other: SupplierType): boolean {
    return this._value === other._value
  }
}
