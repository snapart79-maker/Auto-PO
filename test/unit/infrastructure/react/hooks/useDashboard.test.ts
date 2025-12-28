/**
 * useDashboard Hook 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDashboardStats,
  formatStatValue,
  getStatCardVariant,
  type DashboardStats,
  type OrderStatusCount,
} from '@infrastructure/react/hooks/useDashboard'

describe('useDashboard 유틸리티', () => {
  describe('calculateDashboardStats', () => {
    it('기본 통계 계산', () => {
      const stats = calculateDashboardStats({
        totalProducts: 100,
        totalPartners: 20,
        pendingOrders: 15,
        lowStockItems: 5,
      })

      expect(stats.totalProducts).toBe(100)
      expect(stats.totalPartners).toBe(20)
      expect(stats.pendingOrders).toBe(15)
      expect(stats.lowStockItems).toBe(5)
    })

    it('0 값 처리', () => {
      const stats = calculateDashboardStats({
        totalProducts: 0,
        totalPartners: 0,
        pendingOrders: 0,
        lowStockItems: 0,
      })

      expect(stats.totalProducts).toBe(0)
      expect(stats.totalPartners).toBe(0)
      expect(stats.pendingOrders).toBe(0)
      expect(stats.lowStockItems).toBe(0)
    })
  })

  describe('formatStatValue', () => {
    it('숫자를 천 단위 포맷', () => {
      expect(formatStatValue(1000)).toBe('1,000')
      expect(formatStatValue(1234567)).toBe('1,234,567')
    })

    it('0 값 포맷', () => {
      expect(formatStatValue(0)).toBe('0')
    })

    it('음수 값 포맷', () => {
      expect(formatStatValue(-1000)).toBe('-1,000')
    })
  })

  describe('getStatCardVariant', () => {
    it('lowStock이 0보다 크면 warning 반환', () => {
      expect(getStatCardVariant('lowStockItems', 5)).toBe('warning')
    })

    it('lowStock이 0이면 default 반환', () => {
      expect(getStatCardVariant('lowStockItems', 0)).toBe('default')
    })

    it('pendingOrders는 info 반환', () => {
      expect(getStatCardVariant('pendingOrders', 10)).toBe('info')
    })

    it('기타 타입은 default 반환', () => {
      expect(getStatCardVariant('totalProducts', 100)).toBe('default')
      expect(getStatCardVariant('totalPartners', 50)).toBe('default')
    })
  })

  describe('OrderStatusCount 인터페이스', () => {
    it('상태별 발주 카운트 구조 검증', () => {
      const statusCount: OrderStatusCount = {
        DRAFT: 5,
        CONFIRMED: 3,
        SENT: 2,
        PARTIALLY_RECEIVED: 1,
        COMPLETED: 10,
        CANCELLED: 0,
      }

      expect(statusCount.DRAFT).toBe(5)
      expect(statusCount.CONFIRMED).toBe(3)
      expect(statusCount.SENT).toBe(2)
      expect(statusCount.PARTIALLY_RECEIVED).toBe(1)
      expect(statusCount.COMPLETED).toBe(10)
      expect(statusCount.CANCELLED).toBe(0)
    })
  })

  describe('DashboardStats 인터페이스', () => {
    it('대시보드 통계 구조 검증', () => {
      const stats: DashboardStats = {
        totalProducts: 100,
        totalPartners: 20,
        pendingOrders: 15,
        lowStockItems: 5,
        orderStatusCounts: {
          DRAFT: 5,
          CONFIRMED: 3,
          SENT: 2,
          PARTIALLY_RECEIVED: 1,
          COMPLETED: 10,
          CANCELLED: 0,
        },
      }

      expect(stats.totalProducts).toBe(100)
      expect(stats.orderStatusCounts!.DRAFT).toBe(5)
    })
  })
})
