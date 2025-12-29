/**
 * InitialInventory Entity
 * 초기 재고 - 품목별 기준일 재고 설정
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export interface InitialInventoryProps {
  id: string
  productId: string
  baseDate: Date
  quantity: number
  remarks?: string
  createdBy?: string
  createdAt?: Date
}

export class InitialInventory {
  private constructor(private readonly props: InitialInventoryProps) {}

  get id(): string {
    return this.props.id
  }

  get productId(): string {
    return this.props.productId
  }

  get baseDate(): Date {
    return this.props.baseDate
  }

  get quantity(): number {
    return this.props.quantity
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
   * InitialInventory 생성
   * @throws 수량이 음수인 경우
   */
  static create(props: InitialInventoryProps): InitialInventory {
    if (props.quantity < 0) {
      throw new Error('수량은 0 이상이어야 합니다')
    }

    return new InitialInventory({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    })
  }

  /**
   * 동등성 비교 (ID 기준)
   */
  equals(other: InitialInventory): boolean {
    return this.props.id === other.props.id
  }

  /**
   * 일반 객체로 변환
   */
  toPlainObject(): InitialInventoryProps {
    return { ...this.props }
  }
}
