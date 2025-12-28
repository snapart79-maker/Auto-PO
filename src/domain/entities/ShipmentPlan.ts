/**
 * ShipmentPlan Entity
 * 출고 계획 (일간/주간/월간/연간)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import { Money } from '../valueObjects/Money'

export type PlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface ShipmentPlanProps {
  id: string
  planDate: Date
  planType: PlanType
  partnerId?: string
  productId?: string
  vehicleModelId?: string
  plannedQuantity: number
  unitPrice?: Money
  plannedAmount?: Money
  source: 'MANUAL' | 'UPLOAD' | 'AUTO'
  createdAt?: Date
  updatedAt?: Date
}

export class ShipmentPlan {
  private constructor(private readonly props: ShipmentPlanProps) {}

  get id(): string {
    return this.props.id
  }

  get planDate(): Date {
    return this.props.planDate
  }

  get planType(): PlanType {
    return this.props.planType
  }

  get partnerId(): string | undefined {
    return this.props.partnerId
  }

  get productId(): string | undefined {
    return this.props.productId
  }

  get vehicleModelId(): string | undefined {
    return this.props.vehicleModelId
  }

  get plannedQuantity(): number {
    return this.props.plannedQuantity
  }

  get unitPrice(): Money | undefined {
    return this.props.unitPrice
  }

  get plannedAmount(): Money | undefined {
    return this.props.plannedAmount
  }

  get source(): string {
    return this.props.source
  }

  /**
   * ShipmentPlan 생성
   */
  static create(props: ShipmentPlanProps): ShipmentPlan {
    if (props.plannedQuantity < 0) {
      throw new Error('계획 수량은 0 이상이어야 합니다')
    }

    return new ShipmentPlan({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  /**
   * 계획 수량 변경
   */
  updateQuantity(quantity: number): ShipmentPlan {
    return new ShipmentPlan({
      ...this.props,
      plannedQuantity: quantity,
      updatedAt: new Date(),
    })
  }

  isDaily(): boolean {
    return this.props.planType === 'DAILY'
  }

  isWeekly(): boolean {
    return this.props.planType === 'WEEKLY'
  }

  isMonthly(): boolean {
    return this.props.planType === 'MONTHLY'
  }

  isYearly(): boolean {
    return this.props.planType === 'YEARLY'
  }

  equals(other: ShipmentPlan): boolean {
    return this.props.id === other.props.id
  }
}
