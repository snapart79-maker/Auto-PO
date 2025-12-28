/**
 * VehicleModel Entity
 * 차종 정보
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export interface VehicleModelProps {
  id: string
  vehicleCode: string
  vehicleName: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class VehicleModel {
  private constructor(private readonly props: VehicleModelProps) {}

  get id(): string {
    return this.props.id
  }

  get vehicleCode(): string {
    return this.props.vehicleCode
  }

  get vehicleName(): string {
    return this.props.vehicleName
  }

  get description(): string | undefined {
    return this.props.description
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  /**
   * VehicleModel 생성
   */
  static create(props: VehicleModelProps): VehicleModel {
    if (!props.vehicleCode || props.vehicleCode.trim() === '') {
      throw new Error('차종 코드는 필수입니다')
    }
    if (!props.vehicleName || props.vehicleName.trim() === '') {
      throw new Error('차종명은 필수입니다')
    }

    return new VehicleModel({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  /**
   * 이름 변경
   */
  updateName(vehicleName: string): VehicleModel {
    return new VehicleModel({
      ...this.props,
      vehicleName,
      updatedAt: new Date(),
    })
  }

  /**
   * 설명 변경
   */
  updateDescription(description: string): VehicleModel {
    return new VehicleModel({
      ...this.props,
      description,
      updatedAt: new Date(),
    })
  }

  /**
   * 비활성화
   */
  deactivate(): VehicleModel {
    return new VehicleModel({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    })
  }

  /**
   * 활성화
   */
  activate(): VehicleModel {
    return new VehicleModel({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    })
  }

  equals(other: VehicleModel): boolean {
    return this.props.id === other.props.id
  }
}
