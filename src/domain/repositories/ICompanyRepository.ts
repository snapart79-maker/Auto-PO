/**
 * Company Repository Interface
 * 회사 정보 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { Company } from '../entities/Company'

export interface ICompanyRepository {
  /**
   * 활성화된 회사 정보 조회 (보통 1개)
   */
  findActive(): Promise<Company | null>

  /**
   * ID로 조회
   */
  findById(id: string): Promise<Company | null>

  /**
   * 저장 (생성/수정)
   */
  save(company: Company): Promise<Company>
}
