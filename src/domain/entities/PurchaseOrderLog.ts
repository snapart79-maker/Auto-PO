/**
 * PurchaseOrderLog Entity
 * 발주 이력 (감사 로그)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export interface PurchaseOrderLogProps {
  id: string
  orderId: string
  prevStatus?: string
  newStatus?: string
  changedBy?: string
  changedAt: Date
  remarks?: string
}

export class PurchaseOrderLog {
  private constructor(private readonly props: PurchaseOrderLogProps) {}

  get id(): string {
    return this.props.id
  }

  get orderId(): string {
    return this.props.orderId
  }

  get prevStatus(): string | undefined {
    return this.props.prevStatus
  }

  get newStatus(): string | undefined {
    return this.props.newStatus
  }

  get changedBy(): string | undefined {
    return this.props.changedBy
  }

  get changedAt(): Date {
    return this.props.changedAt
  }

  get remarks(): string | undefined {
    return this.props.remarks
  }

  /**
   * PurchaseOrderLog 생성
   */
  static create(props: PurchaseOrderLogProps): PurchaseOrderLog {
    return new PurchaseOrderLog({
      ...props,
      changedAt: props.changedAt ?? new Date(),
    })
  }

  /**
   * 상태 변경 로그 생성
   */
  static createStatusChange(
    orderId: string,
    prevStatus: string | undefined,
    newStatus: string,
    changedBy?: string,
    remarks?: string
  ): PurchaseOrderLog {
    return new PurchaseOrderLog({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      orderId,
      prevStatus,
      newStatus,
      changedBy,
      changedAt: new Date(),
      remarks,
    })
  }

  equals(other: PurchaseOrderLog): boolean {
    return this.props.id === other.props.id
  }
}
