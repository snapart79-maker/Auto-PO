/**
 * SystemSetting Entity
 * 시스템 설정 - MRP 계산 파라미터 등
 * 외부 라이브러리 의존성 ZERO - 순수 TypeScript
 */

export interface SystemSettingProps {
  id: string
  settingKey: string
  settingValue: string
  description?: string
  updatedBy?: string
  updatedAt?: Date
}

// 잘 알려진 설정 키
export const SETTING_KEYS = {
  AVG_SHIPMENT_DAYS: 'avg_shipment_days',
  DOMESTIC_SAFETY_FACTOR: 'domestic_safety_factor',
  VIETNAM_SAFETY_FACTOR: 'vietnam_safety_factor',
  DEFAULT_DOMESTIC_LEAD_TIME: 'default_domestic_lead_time',
  DEFAULT_OVERSEAS_LEAD_TIME: 'default_overseas_lead_time',
} as const

export class SystemSetting {
  private constructor(private readonly props: SystemSettingProps) {}

  get id(): string {
    return this.props.id
  }

  get settingKey(): string {
    return this.props.settingKey
  }

  get settingValue(): string {
    return this.props.settingValue
  }

  get description(): string | undefined {
    return this.props.description
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy
  }

  get updatedAt(): Date {
    return this.props.updatedAt!
  }

  /**
   * SystemSetting 생성
   * @throws 키 또는 값이 비어있는 경우
   */
  static create(props: SystemSettingProps): SystemSetting {
    if (!props.settingKey || props.settingKey.trim() === '') {
      throw new Error('설정 키는 비어있을 수 없습니다')
    }

    if (!props.settingValue || props.settingValue === '') {
      throw new Error('설정 값은 비어있을 수 없습니다')
    }

    return new SystemSetting({
      ...props,
      updatedAt: props.updatedAt ?? new Date(),
    })
  }

  /**
   * 평균 납품 일수 설정 생성 (팩토리 메서드)
   */
  static createAvgShipmentDaysSetting(value: string): SystemSetting {
    return SystemSetting.create({
      id: crypto.randomUUID ? crypto.randomUUID() : `setting-${Date.now()}`,
      settingKey: SETTING_KEYS.AVG_SHIPMENT_DAYS,
      settingValue: value,
      description: '평균 납품량 계산 기준 일수',
    })
  }

  /**
   * 국내 안전재고 계수 설정 생성 (팩토리 메서드)
   */
  static createDomesticSafetyFactorSetting(value: string): SystemSetting {
    return SystemSetting.create({
      id: crypto.randomUUID ? crypto.randomUUID() : `setting-${Date.now()}`,
      settingKey: SETTING_KEYS.DOMESTIC_SAFETY_FACTOR,
      settingValue: value,
      description: '국내 안전재고 계수',
    })
  }

  /**
   * 베트남 안전재고 계수 설정 생성 (팩토리 메서드)
   */
  static createVietnamSafetyFactorSetting(value: string): SystemSetting {
    return SystemSetting.create({
      id: crypto.randomUUID ? crypto.randomUUID() : `setting-${Date.now()}`,
      settingKey: SETTING_KEYS.VIETNAM_SAFETY_FACTOR,
      settingValue: value,
      description: '베트남 안전재고 계수',
    })
  }

  /**
   * 숫자 값으로 변환
   * @param defaultValue 변환 실패 시 반환할 기본값
   */
  getNumericValue(defaultValue?: number): number {
    const parsed = parseFloat(this.props.settingValue)
    if (isNaN(parsed)) {
      return defaultValue !== undefined ? defaultValue : NaN
    }
    return parsed
  }

  /**
   * 불리언 값으로 변환
   * @param defaultValue 변환 실패 시 반환할 기본값
   */
  getBooleanValue(defaultValue?: boolean): boolean {
    const value = this.props.settingValue.toLowerCase()

    if (['true', '1', 'yes'].includes(value)) {
      return true
    }
    if (['false', '0', 'no'].includes(value)) {
      return false
    }

    return defaultValue !== undefined ? defaultValue : false
  }

  /**
   * 새로운 값으로 설정 업데이트 (불변성 유지)
   */
  updateValue(newValue: string, updatedBy?: string): SystemSetting {
    return new SystemSetting({
      ...this.props,
      settingValue: newValue,
      updatedBy: updatedBy,
      updatedAt: new Date(),
    })
  }

  /**
   * 동등성 비교 (ID 기준)
   */
  equals(other: SystemSetting): boolean {
    return this.props.id === other.props.id
  }

  /**
   * 일반 객체로 변환
   */
  toPlainObject(): SystemSettingProps {
    return { ...this.props }
  }
}
