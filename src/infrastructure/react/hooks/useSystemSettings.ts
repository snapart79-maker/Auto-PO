/**
 * useSystemSettings Hook
 * 시스템 설정 관리 훅
 *
 * PRD 7.2 평균 납품량 계산 기준 일수 설정
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@infrastructure/supabase/client'

// 시스템 설정 키 상수
export const SETTING_KEYS = {
  AVG_SHIPMENT_DAYS: 'avg_shipment_days',
  DOMESTIC_SAFETY_FACTOR: 'domestic_safety_factor',
  VIETNAM_SAFETY_FACTOR: 'vietnam_safety_factor',
} as const

// 기본값
export const DEFAULT_SETTINGS = {
  [SETTING_KEYS.AVG_SHIPMENT_DAYS]: 365,
  [SETTING_KEYS.DOMESTIC_SAFETY_FACTOR]: 1.2,
  [SETTING_KEYS.VIETNAM_SAFETY_FACTOR]: 1.5,
} as const

export interface SystemSetting {
  key: string
  value: string
  description: string | null
}

interface UseSystemSettingsReturn {
  /** 평균 납품량 계산 기준 일수 */
  avgShipmentDays: number
  /** 국내 안전재고 계수 */
  domesticSafetyFactor: number
  /** 베트남 안전재고 계수 */
  vietnamSafetyFactor: number
  /** 로딩 상태 */
  loading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 설정 값 가져오기 */
  getSetting: (key: string) => string | null
  /** 설정 값 업데이트 */
  updateSetting: (key: string, value: string) => Promise<void>
  /** 설정 새로고침 */
  refresh: () => Promise<void>
}

interface SettingRow {
  setting_key: string
  setting_value: string
  description: string | null
}

export function useSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value, description')

      if (fetchError) {
        // 테이블이 없어도 기본값 사용
        console.warn('system_settings 테이블 조회 실패 (기본값 사용):', fetchError.message)
        return
      }

      if (data) {
        const map = new Map<string, string>()
        for (const row of data as SettingRow[]) {
          map.set(row.setting_key, row.setting_value)
        }
        setSettings(map)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '설정 조회 실패'
      setError(message)
      console.error('시스템 설정 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getSetting = useCallback(
    (key: string): string | null => {
      return settings.get(key) ?? null
    },
    [settings]
  )

  const updateSetting = useCallback(
    async (key: string, value: string) => {
      setLoading(true)
      setError(null)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upsertError } = await (supabase.from('system_settings') as any).upsert(
          {
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        )

        if (upsertError) throw new Error(`설정 저장 실패: ${upsertError.message}`)

        // 로컬 상태 업데이트
        setSettings((prev) => {
          const newMap = new Map(prev)
          newMap.set(key, value)
          return newMap
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '설정 저장 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 초기 로드
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // 파생 값 계산
  const avgShipmentDays = parseInt(
    settings.get(SETTING_KEYS.AVG_SHIPMENT_DAYS) ?? String(DEFAULT_SETTINGS[SETTING_KEYS.AVG_SHIPMENT_DAYS]),
    10
  )

  const domesticSafetyFactor = parseFloat(
    settings.get(SETTING_KEYS.DOMESTIC_SAFETY_FACTOR) ?? String(DEFAULT_SETTINGS[SETTING_KEYS.DOMESTIC_SAFETY_FACTOR])
  )

  const vietnamSafetyFactor = parseFloat(
    settings.get(SETTING_KEYS.VIETNAM_SAFETY_FACTOR) ?? String(DEFAULT_SETTINGS[SETTING_KEYS.VIETNAM_SAFETY_FACTOR])
  )

  return {
    avgShipmentDays,
    domesticSafetyFactor,
    vietnamSafetyFactor,
    loading,
    error,
    getSetting,
    updateSetting,
    refresh: fetchSettings,
  }
}
