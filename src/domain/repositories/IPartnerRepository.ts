/**
 * Partner Repository Interface
 * 거래처 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { Partner } from '../entities/Partner'
import type { PartnerType } from '../valueObjects/PartnerType'

export interface PartnerFilter {
  partnerType?: PartnerType
  isActive?: boolean
  searchText?: string
}

export interface IPartnerRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<Partner | null>

  /**
   * 코드로 조회
   */
  findByCode(partnerCode: string): Promise<Partner | null>

  /**
   * 조건에 맞는 거래처 목록 조회
   */
  findAll(filter?: PartnerFilter): Promise<Partner[]>

  /**
   * 유형별 거래처 목록 조회
   */
  findByType(partnerType: PartnerType): Promise<Partner[]>

  /**
   * 저장 (생성/수정)
   */
  save(partner: Partner): Promise<Partner>

  /**
   * 일괄 저장
   */
  saveMany(partners: Partner[]): Promise<Partner[]>

  /**
   * 삭제 (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * 코드 존재 여부 확인
   */
  existsByCode(partnerCode: string): Promise<boolean>
}
