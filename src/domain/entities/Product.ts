/**
 * Product Entity
 * 제품 정보 - 이원화 공급 설정 포함
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import { SupplierType } from '../valueObjects/SupplierType'
import { Money } from '../valueObjects/Money'

export interface ProductProps {
  id: string
  productCode: string
  productName: string
  vehicleModelId?: string
  domesticLeadTime: number
  overseasLeadTime: number
  primarySupplier: SupplierType
  mainPartnerId?: string
  subPartnerId?: string
  domesticRatio: number
  unitPrice?: Money
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface SplitQuantity {
  domestic: number
  vietnam: number
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  get id(): string {
    return this.props.id
  }

  get productCode(): string {
    return this.props.productCode
  }

  get productName(): string {
    return this.props.productName
  }

  get vehicleModelId(): string | undefined {
    return this.props.vehicleModelId
  }

  get domesticLeadTime(): number {
    return this.props.domesticLeadTime
  }

  get overseasLeadTime(): number {
    return this.props.overseasLeadTime
  }

  get primarySupplier(): SupplierType {
    return this.props.primarySupplier
  }

  get mainPartnerId(): string | undefined {
    return this.props.mainPartnerId
  }

  get subPartnerId(): string | undefined {
    return this.props.subPartnerId
  }

  get domesticRatio(): number {
    return this.props.domesticRatio
  }

  get vietnamRatio(): number {
    return 100 - this.props.domesticRatio
  }

  get unitPrice(): Money | undefined {
    return this.props.unitPrice
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  /**
   * Product 생성
   */
  static create(props: ProductProps): Product {
    if (!props.productCode || props.productCode.trim() === '') {
      throw new Error('품번은 필수입니다')
    }
    if (!props.productName || props.productName.trim() === '') {
      throw new Error('품명은 필수입니다')
    }
    if (props.domesticRatio < 0 || props.domesticRatio > 100) {
      throw new Error('국내 비율은 0~100 사이여야 합니다')
    }

    // BOTH 설정 시 양쪽 거래처 필수
    if (props.primarySupplier.isBoth()) {
      if (!props.mainPartnerId) {
        throw new Error('이원화 설정 시 국내 거래처는 필수입니다')
      }
      if (!props.subPartnerId) {
        throw new Error('이원화 설정 시 베트남 거래처는 필수입니다')
      }
    }

    return new Product({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  isDomesticOnly(): boolean {
    return this.props.primarySupplier.isDomestic()
  }

  isVietnamOnly(): boolean {
    return this.props.primarySupplier.isVietnam()
  }

  isDualSourcing(): boolean {
    return this.props.primarySupplier.isBoth()
  }

  /**
   * 안전재고 계수 반환
   */
  getSafetyStockMultiplier(): number {
    return this.props.primarySupplier.safetyStockMultiplier
  }

  /**
   * 리드타임 반환
   * @param type 공급처 유형 (기본값: primarySupplier 기준)
   */
  getLeadTime(type?: 'DOMESTIC' | 'VIETNAM'): number {
    if (type === 'VIETNAM') {
      return this.props.overseasLeadTime
    }
    if (type === 'DOMESTIC') {
      return this.props.domesticLeadTime
    }

    // 기본값: primarySupplier 기준
    if (this.props.primarySupplier.isVietnam()) {
      return this.props.overseasLeadTime
    }
    return this.props.domesticLeadTime
  }

  /**
   * 발주량 분할 계산
   * @param totalQuantity 총 발주량
   */
  splitQuantity(totalQuantity: number): SplitQuantity {
    if (this.isDomesticOnly()) {
      return { domestic: totalQuantity, vietnam: 0 }
    }
    if (this.isVietnamOnly()) {
      return { domestic: 0, vietnam: totalQuantity }
    }

    // BOTH: 비율에 따라 분할
    const domestic = Math.round(totalQuantity * (this.props.domesticRatio / 100))
    const vietnam = totalQuantity - domestic

    return { domestic, vietnam }
  }

  /**
   * 국내 비율 변경
   */
  updateDomesticRatio(ratio: number): Product {
    if (ratio < 0 || ratio > 100) {
      throw new Error('국내 비율은 0~100 사이여야 합니다')
    }
    return new Product({
      ...this.props,
      domesticRatio: ratio,
      updatedAt: new Date(),
    })
  }

  /**
   * 리드타임 변경
   */
  updateLeadTimes(domestic: number, overseas: number): Product {
    return new Product({
      ...this.props,
      domesticLeadTime: domestic,
      overseasLeadTime: overseas,
      updatedAt: new Date(),
    })
  }

  equals(other: Product): boolean {
    return this.props.id === other.props.id
  }
}
