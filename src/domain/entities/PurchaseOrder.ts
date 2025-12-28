/**
 * PurchaseOrder Entity
 * 발주서
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import { OrderStatus } from '../valueObjects/OrderStatus'
import { Money } from '../valueObjects/Money'

export type OrderType = 'DOMESTIC' | 'VIETNAM'

export interface PurchaseOrderProps {
  id: string
  orderNumber: string
  orderDate: Date
  dueDate: Date
  shipmentDate?: Date // 베트남 발주용 선적일
  partnerId: string
  companyId: string
  orderType: OrderType
  status: OrderStatus
  totalQuantity?: number
  totalAmount?: Money
  exchangeRate?: number
  notes?: string
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export class PurchaseOrder {
  private constructor(private readonly props: PurchaseOrderProps) {}

  get id(): string {
    return this.props.id
  }

  get orderNumber(): string {
    return this.props.orderNumber
  }

  get orderDate(): Date {
    return this.props.orderDate
  }

  get dueDate(): Date {
    return this.props.dueDate
  }

  get shipmentDate(): Date | undefined {
    return this.props.shipmentDate
  }

  get partnerId(): string {
    return this.props.partnerId
  }

  get companyId(): string {
    return this.props.companyId
  }

  get orderType(): OrderType {
    return this.props.orderType
  }

  get status(): OrderStatus {
    return this.props.status
  }

  get totalQuantity(): number | undefined {
    return this.props.totalQuantity
  }

  get totalAmount(): Money | undefined {
    return this.props.totalAmount
  }

  get exchangeRate(): number | undefined {
    return this.props.exchangeRate
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  /**
   * 발주번호 생성: PO-YYYYMMDD-NNN
   */
  static generateOrderNumber(date: Date, sequence: number): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const seq = String(sequence).padStart(3, '0')

    return `PO-${year}${month}${day}-${seq}`
  }

  /**
   * PurchaseOrder 생성
   */
  static create(props: PurchaseOrderProps): PurchaseOrder {
    // 베트남 발주는 선적일 필수
    if (props.orderType === 'VIETNAM' && !props.shipmentDate) {
      throw new Error('베트남 발주는 선적일이 필수입니다')
    }

    return new PurchaseOrder({
      ...props,
      status: props.status ?? OrderStatus.DRAFT,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  isEditable(): boolean {
    return this.props.status.isEditable()
  }

  isDomestic(): boolean {
    return this.props.orderType === 'DOMESTIC'
  }

  isVietnam(): boolean {
    return this.props.orderType === 'VIETNAM'
  }

  /**
   * 확정
   */
  confirm(): PurchaseOrder {
    if (this.props.status.isFinal()) {
      throw new Error('취소된 발주는 확정할 수 없습니다')
    }
    if (!this.props.status.canTransitionTo(OrderStatus.CONFIRMED)) {
      throw new Error('현재 상태에서 확정할 수 없습니다')
    }

    return new PurchaseOrder({
      ...this.props,
      status: OrderStatus.CONFIRMED,
      updatedAt: new Date(),
    })
  }

  /**
   * 발송
   */
  send(): PurchaseOrder {
    if (!this.props.status.canTransitionTo(OrderStatus.SENT)) {
      throw new Error('현재 상태에서 발송할 수 없습니다')
    }

    return new PurchaseOrder({
      ...this.props,
      status: OrderStatus.SENT,
      updatedAt: new Date(),
    })
  }

  /**
   * 부분 입고
   */
  receivePartially(): PurchaseOrder {
    if (!this.props.status.canTransitionTo(OrderStatus.PARTIALLY_RECEIVED)) {
      throw new Error('현재 상태에서 부분 입고 처리할 수 없습니다')
    }

    return new PurchaseOrder({
      ...this.props,
      status: OrderStatus.PARTIALLY_RECEIVED,
      updatedAt: new Date(),
    })
  }

  /**
   * 완료
   */
  complete(): PurchaseOrder {
    if (!this.props.status.canTransitionTo(OrderStatus.COMPLETED)) {
      throw new Error('현재 상태에서 완료할 수 없습니다')
    }

    return new PurchaseOrder({
      ...this.props,
      status: OrderStatus.COMPLETED,
      updatedAt: new Date(),
    })
  }

  /**
   * 취소
   */
  cancel(): PurchaseOrder {
    if (this.props.status.equals(OrderStatus.COMPLETED)) {
      throw new Error('완료된 발주는 취소할 수 없습니다')
    }
    if (!this.props.status.canTransitionTo(OrderStatus.CANCELLED)) {
      throw new Error('현재 상태에서 취소할 수 없습니다')
    }

    return new PurchaseOrder({
      ...this.props,
      status: OrderStatus.CANCELLED,
      updatedAt: new Date(),
    })
  }

  /**
   * 비고 업데이트
   */
  updateNotes(notes: string): PurchaseOrder {
    return new PurchaseOrder({
      ...this.props,
      notes,
      updatedAt: new Date(),
    })
  }

  equals(other: PurchaseOrder): boolean {
    return this.props.id === other.props.id
  }
}
