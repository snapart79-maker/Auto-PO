/**
 * SystemSetting Entity Tests
 * TDD - RED Phase: 테스트 먼저 작성
 */

import { describe, it, expect } from 'vitest'
import { SystemSetting } from '@domain/entities/SystemSetting'

describe('SystemSetting', () => {
  const validProps = {
    id: 'setting-uuid-123',
    settingKey: 'avg_shipment_days',
    settingValue: '365',
    description: '평균 납품량 계산 기준 일수',
    updatedBy: 'user-uuid-789',
  }

  describe('create', () => {
    it('유효한 props로 SystemSetting을 생성한다', () => {
      const setting = SystemSetting.create(validProps)

      expect(setting.id).toBe(validProps.id)
      expect(setting.settingKey).toBe(validProps.settingKey)
      expect(setting.settingValue).toBe(validProps.settingValue)
      expect(setting.description).toBe(validProps.description)
      expect(setting.updatedBy).toBe(validProps.updatedBy)
      expect(setting.updatedAt).toBeInstanceOf(Date)
    })

    it('빈 key인 경우 에러를 발생시킨다', () => {
      const props = { ...validProps, settingKey: '' }

      expect(() => SystemSetting.create(props)).toThrow('설정 키는 비어있을 수 없습니다')
    })

    it('공백만 있는 key인 경우 에러를 발생시킨다', () => {
      const props = { ...validProps, settingKey: '   ' }

      expect(() => SystemSetting.create(props)).toThrow('설정 키는 비어있을 수 없습니다')
    })

    it('빈 value인 경우 에러를 발생시킨다', () => {
      const props = { ...validProps, settingValue: '' }

      expect(() => SystemSetting.create(props)).toThrow('설정 값은 비어있을 수 없습니다')
    })

    it('description 없이도 생성할 수 있다', () => {
      const { description, ...propsWithoutDesc } = validProps
      const setting = SystemSetting.create(propsWithoutDesc)

      expect(setting.description).toBeUndefined()
    })

    it('updatedBy 없이도 생성할 수 있다', () => {
      const { updatedBy, ...propsWithoutUpdatedBy } = validProps
      const setting = SystemSetting.create(propsWithoutUpdatedBy)

      expect(setting.updatedBy).toBeUndefined()
    })
  })

  describe('getNumericValue', () => {
    it('숫자 문자열을 숫자로 변환한다', () => {
      const setting = SystemSetting.create(validProps)

      expect(setting.getNumericValue()).toBe(365)
    })

    it('소수점 문자열을 숫자로 변환한다', () => {
      const props = { ...validProps, settingValue: '1.5' }
      const setting = SystemSetting.create(props)

      expect(setting.getNumericValue()).toBe(1.5)
    })

    it('숫자가 아닌 경우 기본값을 반환한다', () => {
      const props = { ...validProps, settingValue: 'not-a-number' }
      const setting = SystemSetting.create(props)

      expect(setting.getNumericValue(0)).toBe(0)
      expect(setting.getNumericValue(100)).toBe(100)
    })

    it('기본값 없이 숫자가 아닌 경우 NaN을 반환한다', () => {
      const props = { ...validProps, settingValue: 'not-a-number' }
      const setting = SystemSetting.create(props)

      expect(setting.getNumericValue()).toBeNaN()
    })
  })

  describe('getBooleanValue', () => {
    it('"true" 문자열을 true로 변환한다', () => {
      const props = { ...validProps, settingValue: 'true' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue()).toBe(true)
    })

    it('"1" 문자열을 true로 변환한다', () => {
      const props = { ...validProps, settingValue: '1' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue()).toBe(true)
    })

    it('"yes" 문자열을 true로 변환한다', () => {
      const props = { ...validProps, settingValue: 'yes' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue()).toBe(true)
    })

    it('"false" 문자열을 false로 변환한다', () => {
      const props = { ...validProps, settingValue: 'false' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue()).toBe(false)
    })

    it('"0" 문자열을 false로 변환한다', () => {
      const props = { ...validProps, settingValue: '0' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue()).toBe(false)
    })

    it('기타 값은 기본값을 반환한다', () => {
      const props = { ...validProps, settingValue: 'maybe' }
      const setting = SystemSetting.create(props)

      expect(setting.getBooleanValue(false)).toBe(false)
      expect(setting.getBooleanValue(true)).toBe(true)
    })
  })

  describe('updateValue', () => {
    it('새로운 값으로 설정을 업데이트한다', () => {
      const setting = SystemSetting.create(validProps)
      const updated = setting.updateValue('730', 'admin-uuid')

      expect(updated.settingValue).toBe('730')
      expect(updated.updatedBy).toBe('admin-uuid')
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(setting.updatedAt.getTime())
    })

    it('원본 설정은 변경되지 않는다 (불변성)', () => {
      const setting = SystemSetting.create(validProps)
      setting.updateValue('730', 'admin-uuid')

      expect(setting.settingValue).toBe('365')
    })
  })

  describe('equals', () => {
    it('같은 ID를 가진 설정은 동일하다', () => {
      const setting1 = SystemSetting.create(validProps)
      const setting2 = SystemSetting.create({ ...validProps, settingValue: '730' })

      expect(setting1.equals(setting2)).toBe(true)
    })

    it('다른 ID를 가진 설정은 다르다', () => {
      const setting1 = SystemSetting.create(validProps)
      const setting2 = SystemSetting.create({ ...validProps, id: 'different-uuid' })

      expect(setting1.equals(setting2)).toBe(false)
    })
  })

  describe('toPlainObject', () => {
    it('엔티티를 일반 객체로 변환한다', () => {
      const setting = SystemSetting.create(validProps)
      const plain = setting.toPlainObject()

      expect(plain.id).toBe(validProps.id)
      expect(plain.settingKey).toBe(validProps.settingKey)
      expect(plain.settingValue).toBe(validProps.settingValue)
      expect(plain).toHaveProperty('updatedAt')
    })
  })

  describe('well-known settings', () => {
    it('평균 납품 일수 설정을 생성한다', () => {
      const setting = SystemSetting.createAvgShipmentDaysSetting('365')
      expect(setting.settingKey).toBe('avg_shipment_days')
    })

    it('국내 안전재고 계수 설정을 생성한다', () => {
      const setting = SystemSetting.createDomesticSafetyFactorSetting('1.2')
      expect(setting.settingKey).toBe('domestic_safety_factor')
    })

    it('베트남 안전재고 계수 설정을 생성한다', () => {
      const setting = SystemSetting.createVietnamSafetyFactorSetting('1.5')
      expect(setting.settingKey).toBe('vietnam_safety_factor')
    })
  })
})
