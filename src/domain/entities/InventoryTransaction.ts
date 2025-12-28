/**
 * InventoryTransaction Entity
 * 입출고 이력 (MES 데이터)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import { Money } from '../valueObjects/Money'

export type TransactionType = 'IN' | 'OUT'

export interface InventoryTransactionProps {
  id: string
  transactionDate: Date
  transactionType: TransactionType
  partnerId?: string
  productId?: string
  quantity: number
  unitPrice?: Money
  supplyAmount?: Money
  exchangeRate?: number
  totalAmount?: Money
  itemType?: string // 원재료, 반제품, 완제품
  uploadBatchId?: string
  createdAt?: Date
}

export class InventoryTransaction {
  private constructor(private readonly props: InventoryTransactionProps) {}

  get id(): string {
    return this.props.id
  }

  get transactionDate(): Date {
    return this.props.transactionDate
  }

  get transactionType(): TransactionType {
    return this.props.transactionType
  }

  get partnerId(): string | undefined {
    return this.props.partnerId
  }

  get productId(): string | undefined {
    return this.props.productId
  }

  get quantity(): number {
    return this.props.quantity
  }

  get unitPrice(): Money | undefined {
    return this.props.unitPrice
  }

  get supplyAmount(): Money | undefined {
    return this.props.supplyAmount
  }

  get exchangeRate(): number | undefined {
    return this.props.exchangeRate
  }

  get totalAmount(): Money | undefined {
    return this.props.totalAmount
  }

  get itemType(): string | undefined {
    return this.props.itemType
  }

  get uploadBatchId(): string | undefined {
    return this.props.uploadBatchId
  }

  /**
   * InventoryTransaction 생성
   */
  static create(props: InventoryTransactionProps): InventoryTransaction {
    if (props.quantity <= 0) {
      throw new Error('수량은 0보다 커야 합니다')
    }

    return new InventoryTransaction({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    })
  }

  isInbound(): boolean {
    return this.props.transactionType === 'IN'
  }

  isOutbound(): boolean {
    return this.props.transactionType === 'OUT'
  }

  equals(other: InventoryTransaction): boolean {
    return this.props.id === other.props.id
  }
}
