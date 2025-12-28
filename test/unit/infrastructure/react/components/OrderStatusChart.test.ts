/**
 * OrderStatusChart 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  STATUS_COLORS,
  transformChartData,
  calculateTotalOrders,
} from '@infrastructure/react/components/OrderStatusChart'
import type { OrderStatusCount } from '@infrastructure/react/hooks/useDashboard'

describe('OrderStatusChart 유틸리티', () => {
  describe('STATUS_COLORS', () => {
    it('모든 상태에 색상이 정의되어야 한다', () => {
      expect(STATUS_COLORS.DRAFT).toBeDefined()
      expect(STATUS_COLORS.CONFIRMED).toBeDefined()
      expect(STATUS_COLORS.SENT).toBeDefined()
      expect(STATUS_COLORS.PARTIALLY_RECEIVED).toBeDefined()
      expect(STATUS_COLORS.COMPLETED).toBeDefined()
      expect(STATUS_COLORS.CANCELLED).toBeDefined()
    })

    it('색상은 hex 형식이어야 한다', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/
      expect(STATUS_COLORS.DRAFT).toMatch(hexPattern)
      expect(STATUS_COLORS.CONFIRMED).toMatch(hexPattern)
    })
  })

  describe('transformChartData', () => {
    it('카운트가 0인 상태는 제외', () => {
      const statusCounts: OrderStatusCount = {
        DRAFT: 5,
        CONFIRMED: 0,
        SENT: 3,
        PARTIALLY_RECEIVED: 0,
        COMPLETED: 10,
        CANCELLED: 0,
      }

      const result = transformChartData(statusCounts)
      expect(result.length).toBe(3) // DRAFT, SENT, COMPLETED만
      expect(result.find((d) => d.statusKey === 'CONFIRMED')).toBeUndefined()
    })

    it('차트 데이터 구조 검증', () => {
      const statusCounts: OrderStatusCount = {
        DRAFT: 5,
        CONFIRMED: 3,
        SENT: 0,
        PARTIALLY_RECEIVED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }

      const result = transformChartData(statusCounts)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('value')
      expect(result[0]).toHaveProperty('color')
      expect(result[0]).toHaveProperty('statusKey')
    })

    it('빈 데이터는 빈 배열 반환', () => {
      const statusCounts: OrderStatusCount = {
        DRAFT: 0,
        CONFIRMED: 0,
        SENT: 0,
        PARTIALLY_RECEIVED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }

      const result = transformChartData(statusCounts)
      expect(result).toHaveLength(0)
    })
  })

  describe('calculateTotalOrders', () => {
    it('모든 상태의 합계 계산', () => {
      const statusCounts: OrderStatusCount = {
        DRAFT: 5,
        CONFIRMED: 3,
        SENT: 2,
        PARTIALLY_RECEIVED: 1,
        COMPLETED: 10,
        CANCELLED: 2,
      }

      expect(calculateTotalOrders(statusCounts)).toBe(23)
    })

    it('모두 0인 경우 0 반환', () => {
      const statusCounts: OrderStatusCount = {
        DRAFT: 0,
        CONFIRMED: 0,
        SENT: 0,
        PARTIALLY_RECEIVED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }

      expect(calculateTotalOrders(statusCounts)).toBe(0)
    })
  })
})
