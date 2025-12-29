/**
 * SystemSetting Repository Interface
 * 시스템 설정 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { SystemSetting } from '../entities/SystemSetting'

export interface ISystemSettingRepository {
  /**
   * ID로 설정 조회
   */
  findById(id: string): Promise<SystemSetting | null>

  /**
   * 키로 설정 조회
   */
  findByKey(key: string): Promise<SystemSetting | null>

  /**
   * 모든 설정 조회
   */
  findAll(): Promise<SystemSetting[]>

  /**
   * 설정 저장 (생성 또는 업데이트)
   */
  save(setting: SystemSetting): Promise<SystemSetting>

  /**
   * 설정 삭제
   */
  delete(id: string): Promise<void>

  // ============================================
  // 자주 사용하는 설정 조회 헬퍼 메서드
  // ============================================

  /**
   * 평균 납품량 계산 기준 일수 조회
   * @default 365
   */
  getAvgShipmentDays(): Promise<number>

  /**
   * 국내 안전재고 계수 조회
   * @default 1.2
   */
  getDomesticSafetyFactor(): Promise<number>

  /**
   * 베트남 안전재고 계수 조회
   * @default 1.5
   */
  getVietnamSafetyFactor(): Promise<number>

  /**
   * 기본 국내 리드타임 조회
   * @default 3
   */
  getDefaultDomesticLeadTime(): Promise<number>

  /**
   * 기본 해외 리드타임 조회
   * @default 21
   */
  getDefaultOverseasLeadTime(): Promise<number>
}
