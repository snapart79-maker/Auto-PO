/**
 * OrderStatus Value Object
 * 발주 상태 및 상태 전이 규칙
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

type OrderStatusValue =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'

const DISPLAY_NAMES: Record<OrderStatusValue, string> = {
  DRAFT: '초안',
  CONFIRMED: '확정',
  SENT: '발송',
  PARTIALLY_RECEIVED: '부분입고',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

// 상태 전이 규칙
const VALID_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export class OrderStatus {
  private constructor(private readonly _value: OrderStatusValue) {}

  get value(): OrderStatusValue {
    return this._value
  }

  get displayName(): string {
    return DISPLAY_NAMES[this._value]
  }

  // Singleton instances
  static readonly DRAFT = new OrderStatus('DRAFT')
  static readonly CONFIRMED = new OrderStatus('CONFIRMED')
  static readonly SENT = new OrderStatus('SENT')
  static readonly PARTIALLY_RECEIVED = new OrderStatus('PARTIALLY_RECEIVED')
  static readonly COMPLETED = new OrderStatus('COMPLETED')
  static readonly CANCELLED = new OrderStatus('CANCELLED')

  /**
   * 문자열에서 OrderStatus 생성
   */
  static fromString(value: string): OrderStatus {
    switch (value) {
      case 'DRAFT':
        return OrderStatus.DRAFT
      case 'CONFIRMED':
        return OrderStatus.CONFIRMED
      case 'SENT':
        return OrderStatus.SENT
      case 'PARTIALLY_RECEIVED':
        return OrderStatus.PARTIALLY_RECEIVED
      case 'COMPLETED':
        return OrderStatus.COMPLETED
      case 'CANCELLED':
        return OrderStatus.CANCELLED
      default:
        throw new Error(`유효하지 않은 발주 상태: ${value}`)
    }
  }

  /**
   * 해당 상태로 전이 가능한지 확인
   */
  canTransitionTo(target: OrderStatus): boolean {
    return VALID_TRANSITIONS[this._value].includes(target._value)
  }

  isDraft(): boolean {
    return this._value === 'DRAFT'
  }

  isConfirmed(): boolean {
    return this._value === 'CONFIRMED'
  }

  isSent(): boolean {
    return this._value === 'SENT'
  }

  /**
   * 편집 가능 여부 (DRAFT 상태만 편집 가능)
   */
  isEditable(): boolean {
    return this._value === 'DRAFT'
  }

  /**
   * 최종 상태 여부 (더 이상 변경 불가)
   */
  isFinal(): boolean {
    return this._value === 'COMPLETED' || this._value === 'CANCELLED'
  }

  equals(other: OrderStatus): boolean {
    return this._value === other._value
  }
}
