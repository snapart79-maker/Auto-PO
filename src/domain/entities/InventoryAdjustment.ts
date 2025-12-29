/**
 * InventoryAdjustment Entity
 * 재고 조정 - 실사/분실/파손에 의한 재고 증감
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export type AdjustmentType = 'INCREASE' | 'DECREASE'
export type AdjustmentReason = 'PHYSICAL_COUNT' | 'LOSS' | 'DAMAGE' | 'OTHER'

const REASON_LABELS: Record<AdjustmentReason, string> = {
  PHYSICAL_COUNT: '실사',
  LOSS: '분실',
  DAMAGE: '파손',
  OTHER: '기타',
}

export interface InventoryAdjustmentProps {
  id: string
  adjustmentDate: Date
  productId: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: AdjustmentReason
  remarks?: string
  createdBy?: string
  createdAt?: Date
}

export class InventoryAdjustment {
  private constructor(private readonly props: InventoryAdjustmentProps) {}

  get id(): string {
    return this.props.id
  }

  get adjustmentDate(): Date {
    return this.props.adjustmentDate
  }

  get productId(): string {
    return this.props.productId
  }

  get adjustmentType(): AdjustmentType {
    return this.props.adjustmentType
  }

  get quantity(): number {
    return this.props.quantity
  }

  get reason(): AdjustmentReason {
    return this.props.reason
  }

  get remarks(): string | undefined {
    return this.props.remarks
  }

  get createdBy(): string | undefined {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt!
  }

  /**
   * InventoryAdjustment 생성
   * @throws 수량이 0 이하인 경우
   */
  static create(props: InventoryAdjustmentProps): InventoryAdjustment {
    if (props.quantity <= 0) {
      throw new Error('조정 수량은 0보다 커야 합니다')
    }

    return new InventoryAdjustment({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    })
  }

  /**
   * 증가 조정인지 확인
   */
  isIncrease(): boolean {
    return this.props.adjustmentType === 'INCREASE'
  }

  /**
   * 감소 조정인지 확인
   */
  isDecrease(): boolean {
    return this.props.adjustmentType === 'DECREASE'
  }

  /**
   * 부호가 포함된 수량 반환
   * INCREASE: 양수, DECREASE: 음수
   */
  getSignedQuantity(): number {
    return this.isIncrease() ? this.props.quantity : -this.props.quantity
  }

  /**
   * 사유 한글 라벨 반환
   */
  getReasonLabel(): string {
    return REASON_LABELS[this.props.reason]
  }

  /**
   * 동등성 비교 (ID 기준)
   */
  equals(other: InventoryAdjustment): boolean {
    return this.props.id === other.props.id
  }

  /**
   * 일반 객체로 변환
   */
  toPlainObject(): InventoryAdjustmentProps {
    return { ...this.props }
  }
}
