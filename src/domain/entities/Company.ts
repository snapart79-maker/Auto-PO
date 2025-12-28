/**
 * Company Entity
 * 회사 정보 - 발주서 발급 주체
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export interface CompanyProps {
  id: string
  companyNameKr: string
  companyNameEn?: string
  ceoName: string
  businessNumber: string
  addressKr: string
  addressEn?: string
  phone?: string
  fax?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface OrderHeader {
  companyName: string
  ceoName: string
  businessNumber: string
  address: string
  phone?: string
  fax?: string
}

export class Company {
  private constructor(private readonly props: CompanyProps) {}

  get id(): string {
    return this.props.id
  }

  get companyNameKr(): string {
    return this.props.companyNameKr
  }

  get companyNameEn(): string | undefined {
    return this.props.companyNameEn
  }

  get ceoName(): string {
    return this.props.ceoName
  }

  get businessNumber(): string {
    return this.props.businessNumber
  }

  get addressKr(): string {
    return this.props.addressKr
  }

  get addressEn(): string | undefined {
    return this.props.addressEn
  }

  get phone(): string | undefined {
    return this.props.phone
  }

  get fax(): string | undefined {
    return this.props.fax
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  /**
   * Company 생성
   */
  static create(props: CompanyProps): Company {
    if (!props.companyNameKr || props.companyNameKr.trim() === '') {
      throw new Error('회사명(국문)은 필수입니다')
    }
    if (!props.ceoName || props.ceoName.trim() === '') {
      throw new Error('대표이사명은 필수입니다')
    }
    if (!props.businessNumber || props.businessNumber.trim() === '') {
      throw new Error('사업자등록번호는 필수입니다')
    }
    if (!props.addressKr || props.addressKr.trim() === '') {
      throw new Error('주소(국문)는 필수입니다')
    }

    return new Company({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  /**
   * 대표이사 변경
   */
  updateCeo(ceoName: string): Company {
    return new Company({
      ...this.props,
      ceoName,
      updatedAt: new Date(),
    })
  }

  /**
   * 연락처 변경
   */
  updateContact(phone: string, fax: string): Company {
    return new Company({
      ...this.props,
      phone,
      fax,
      updatedAt: new Date(),
    })
  }

  /**
   * 주소 변경
   */
  updateAddress(addressKr: string, addressEn?: string): Company {
    return new Company({
      ...this.props,
      addressKr,
      addressEn,
      updatedAt: new Date(),
    })
  }

  /**
   * 국문 발주서 헤더 정보
   */
  getOrderHeaderKr(): OrderHeader {
    return {
      companyName: this.props.companyNameKr,
      ceoName: this.props.ceoName,
      businessNumber: this.props.businessNumber,
      address: this.props.addressKr,
      phone: this.props.phone,
      fax: this.props.fax,
    }
  }

  /**
   * 영문 발주서 헤더 정보
   */
  getOrderHeaderEn(): OrderHeader {
    return {
      companyName: this.props.companyNameEn ?? this.props.companyNameKr,
      ceoName: this.props.ceoName,
      businessNumber: this.props.businessNumber,
      address: this.props.addressEn ?? this.props.addressKr,
      phone: this.props.phone,
      fax: this.props.fax,
    }
  }

  equals(other: Company): boolean {
    return this.props.id === other.props.id
  }
}
