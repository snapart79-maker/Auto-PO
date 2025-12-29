/**
 * Partner Entity
 * 거래처 정보 (협력사, 고객사, 베트남)
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

import { PartnerType } from '../valueObjects/PartnerType'

export interface PartnerProps {
  id: string
  partnerCode: string
  partnerName: string
  partnerType: PartnerType
  businessNumber?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  currency: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  // 확장 필드
  note?: string
  partnerGroup?: string
  ceoName?: string
  foundationDate?: Date
  postalCode?: string
  businessType?: string
  industryType?: string
  countryCode?: string
  incoterms?: string
  phone2?: string
  website?: string
  partnerContactPhone?: string
  manager?: string
  effectiveStartDate?: Date
  effectiveEndDate?: Date
}

export interface ContactInfo {
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
}

export class Partner {
  private constructor(private readonly props: PartnerProps) {}

  get id(): string {
    return this.props.id
  }

  get partnerCode(): string {
    return this.props.partnerCode
  }

  get partnerName(): string {
    return this.props.partnerName
  }

  get partnerType(): PartnerType {
    return this.props.partnerType
  }

  get businessNumber(): string | undefined {
    return this.props.businessNumber
  }

  get address(): string | undefined {
    return this.props.address
  }

  get contactPerson(): string | undefined {
    return this.props.contactPerson
  }

  get contactPhone(): string | undefined {
    return this.props.contactPhone
  }

  get contactEmail(): string | undefined {
    return this.props.contactEmail
  }

  get currency(): string {
    return this.props.currency
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  // 확장 필드 getter
  get note(): string | undefined {
    return this.props.note
  }

  get partnerGroup(): string | undefined {
    return this.props.partnerGroup
  }

  get ceoName(): string | undefined {
    return this.props.ceoName
  }

  get foundationDate(): Date | undefined {
    return this.props.foundationDate
  }

  get postalCode(): string | undefined {
    return this.props.postalCode
  }

  get businessType(): string | undefined {
    return this.props.businessType
  }

  get industryType(): string | undefined {
    return this.props.industryType
  }

  get countryCode(): string | undefined {
    return this.props.countryCode
  }

  get incoterms(): string | undefined {
    return this.props.incoterms
  }

  get phone2(): string | undefined {
    return this.props.phone2
  }

  get website(): string | undefined {
    return this.props.website
  }

  get partnerContactPhone(): string | undefined {
    return this.props.partnerContactPhone
  }

  get manager(): string | undefined {
    return this.props.manager
  }

  get effectiveStartDate(): Date | undefined {
    return this.props.effectiveStartDate
  }

  get effectiveEndDate(): Date | undefined {
    return this.props.effectiveEndDate
  }

  /**
   * Partner 생성
   */
  static create(props: PartnerProps): Partner {
    if (!props.partnerCode || props.partnerCode.trim() === '') {
      throw new Error('거래처 코드는 필수입니다')
    }
    if (!props.partnerName || props.partnerName.trim() === '') {
      throw new Error('거래처명은 필수입니다')
    }

    return new Partner({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  isSupplier(): boolean {
    return this.props.partnerType.isSupplier()
  }

  isCustomer(): boolean {
    return this.props.partnerType.isCustomer()
  }

  isVietnam(): boolean {
    return this.props.partnerType.isVietnam()
  }

  /**
   * 이름 변경
   */
  updateName(partnerName: string): Partner {
    return new Partner({
      ...this.props,
      partnerName,
      updatedAt: new Date(),
    })
  }

  /**
   * 연락처 정보 변경
   */
  updateContact(contact: ContactInfo): Partner {
    return new Partner({
      ...this.props,
      contactPerson: contact.contactPerson,
      contactPhone: contact.contactPhone,
      contactEmail: contact.contactEmail,
      updatedAt: new Date(),
    })
  }

  /**
   * 비활성화
   */
  deactivate(): Partner {
    return new Partner({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    })
  }

  /**
   * 활성화
   */
  activate(): Partner {
    return new Partner({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    })
  }

  equals(other: Partner): boolean {
    return this.props.id === other.props.id
  }
}
