/**
 * PartnerType Value Object
 * 거래처 유형: SUPPLIER (협력사), CUSTOMER (고객사), VIETNAM (베트남)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

type PartnerTypeValue = 'SUPPLIER' | 'CUSTOMER' | 'VIETNAM'

const DISPLAY_NAMES: Record<PartnerTypeValue, string> = {
  SUPPLIER: '협력사',
  CUSTOMER: '고객사',
  VIETNAM: '베트남',
}

export class PartnerType {
  private constructor(private readonly _value: PartnerTypeValue) {}

  get value(): PartnerTypeValue {
    return this._value
  }

  get displayName(): string {
    return DISPLAY_NAMES[this._value]
  }

  // Singleton instances
  static readonly SUPPLIER = new PartnerType('SUPPLIER')
  static readonly CUSTOMER = new PartnerType('CUSTOMER')
  static readonly VIETNAM = new PartnerType('VIETNAM')

  /**
   * 문자열에서 PartnerType 생성
   */
  static fromString(value: string): PartnerType {
    switch (value) {
      case 'SUPPLIER':
        return PartnerType.SUPPLIER
      case 'CUSTOMER':
        return PartnerType.CUSTOMER
      case 'VIETNAM':
        return PartnerType.VIETNAM
      default:
        throw new Error(`유효하지 않은 거래처 유형: ${value}`)
    }
  }

  isSupplier(): boolean {
    return this._value === 'SUPPLIER'
  }

  isCustomer(): boolean {
    return this._value === 'CUSTOMER'
  }

  isVietnam(): boolean {
    return this._value === 'VIETNAM'
  }

  equals(other: PartnerType): boolean {
    return this._value === other._value
  }
}
