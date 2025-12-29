/**
 * InventoryService Unit Tests
 * TDD - RED Phase: 테스트 먼저 작성
 *
 * 재고 관련 순수 계산 로직 서비스
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryService, StockStatusThreshold } from '@application/services/InventoryService'
import { StockStatus } from '@domain/entities/CurrentInventory'

describe('InventoryService', () => {
  let service: InventoryService

  beforeEach(() => {
    service = new InventoryService()
  })

  describe('calculateCurrentStock', () => {
    it('현재고 = 초기재고 + 입고 - 출고 + 조정', () => {
      const result = service.calculateCurrentStock({
        initialQty: 100,
        inboundQty: 500,
        outboundQty: 300,
        adjustmentQty: 50,
      })

      // 100 + 500 - 300 + 50 = 350
      expect(result).toBe(350)
    })

    it('조정이 음수일 때도 올바르게 계산한다', () => {
      const result = service.calculateCurrentStock({
        initialQty: 100,
        inboundQty: 200,
        outboundQty: 100,
        adjustmentQty: -30,
      })

      // 100 + 200 - 100 - 30 = 170
      expect(result).toBe(170)
    })

    it('모든 값이 0일 때 0을 반환한다', () => {
      const result = service.calculateCurrentStock({
        initialQty: 0,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
      })

      expect(result).toBe(0)
    })

    it('결과가 음수가 될 수 있다', () => {
      const result = service.calculateCurrentStock({
        initialQty: 0,
        inboundQty: 100,
        outboundQty: 200,
        adjustmentQty: 0,
      })

      // 0 + 100 - 200 + 0 = -100
      expect(result).toBe(-100)
    })
  })

  describe('calculateStockStatus', () => {
    it('현재고 >= 안전재고 × 70%일 때 NORMAL', () => {
      // safetyStock = 200, 70% = 140
      // currentQty = 150 >= 140 → NORMAL
      const status = service.calculateStockStatus(150, 200)

      expect(status).toBe(StockStatus.NORMAL)
    })

    it('안전재고 × 50% <= 현재고 < 안전재고 × 70%일 때 CAUTION', () => {
      // safetyStock = 200, 70% = 140, 50% = 100
      // currentQty = 110 → CAUTION
      const status = service.calculateStockStatus(110, 200)

      expect(status).toBe(StockStatus.CAUTION)
    })

    it('안전재고 × 30% <= 현재고 < 안전재고 × 50%일 때 WARNING', () => {
      // safetyStock = 200, 50% = 100, 30% = 60
      // currentQty = 70 → WARNING
      const status = service.calculateStockStatus(70, 200)

      expect(status).toBe(StockStatus.WARNING)
    })

    it('현재고 < 안전재고 × 30%일 때 CRITICAL', () => {
      // safetyStock = 200, 30% = 60
      // currentQty = 50 → CRITICAL
      const status = service.calculateStockStatus(50, 200)

      expect(status).toBe(StockStatus.CRITICAL)
    })

    it('현재고가 음수일 때 CRITICAL', () => {
      const status = service.calculateStockStatus(-10, 200)

      expect(status).toBe(StockStatus.CRITICAL)
    })

    it('안전재고가 0일 때 현재고가 있으면 NORMAL', () => {
      const status = service.calculateStockStatus(100, 0)

      expect(status).toBe(StockStatus.NORMAL)
    })

    it('안전재고와 현재고가 둘 다 0일 때 NORMAL', () => {
      const status = service.calculateStockStatus(0, 0)

      expect(status).toBe(StockStatus.NORMAL)
    })
  })

  describe('calculateAvailableStock', () => {
    it('가용 재고 = 현재고 + 입고예정', () => {
      const result = service.calculateAvailableStock(100, 50)

      expect(result).toBe(150)
    })

    it('입고예정이 없을 때 현재고만 반환', () => {
      const result = service.calculateAvailableStock(100, 0)

      expect(result).toBe(100)
    })

    it('현재고가 음수여도 계산 가능', () => {
      const result = service.calculateAvailableStock(-50, 100)

      expect(result).toBe(50)
    })
  })

  describe('getDailyAverageFromQuantities', () => {
    it('총 출고량을 일수로 나눈 일평균을 반환한다', () => {
      // 총 3650개, 365일 → 일평균 10
      const result = service.getDailyAverageFromQuantities(3650, 365)

      expect(result).toBe(10)
    })

    it('소수점 2자리까지 반올림한다', () => {
      // 100 / 7 = 14.285714... → 14.29
      const result = service.getDailyAverageFromQuantities(100, 7)

      expect(result).toBe(14.29)
    })

    it('일수가 0일 때 0을 반환한다', () => {
      const result = service.getDailyAverageFromQuantities(100, 0)

      expect(result).toBe(0)
    })

    it('출고량이 0일 때 0을 반환한다', () => {
      const result = service.getDailyAverageFromQuantities(0, 30)

      expect(result).toBe(0)
    })
  })

  describe('getStatusLabel', () => {
    it('각 상태에 맞는 한글 라벨을 반환한다', () => {
      expect(service.getStatusLabel(StockStatus.NORMAL)).toBe('정상')
      expect(service.getStatusLabel(StockStatus.CAUTION)).toBe('주의')
      expect(service.getStatusLabel(StockStatus.WARNING)).toBe('경고')
      expect(service.getStatusLabel(StockStatus.CRITICAL)).toBe('위험')
    })
  })

  describe('getStatusColor', () => {
    it('각 상태에 맞는 색상 코드를 반환한다', () => {
      expect(service.getStatusColor(StockStatus.NORMAL)).toBe('#22C55E')
      expect(service.getStatusColor(StockStatus.CAUTION)).toBe('#F59E0B')
      expect(service.getStatusColor(StockStatus.WARNING)).toBe('#F97316')
      expect(service.getStatusColor(StockStatus.CRITICAL)).toBe('#EF4444')
    })
  })

  describe('calculateNetAdjustment', () => {
    it('증가와 감소를 합산하여 순 조정량을 계산한다', () => {
      const adjustments = [
        { type: 'INCREASE' as const, quantity: 100 },
        { type: 'DECREASE' as const, quantity: 30 },
        { type: 'INCREASE' as const, quantity: 50 },
        { type: 'DECREASE' as const, quantity: 20 },
      ]

      // 증가: 100 + 50 = 150
      // 감소: 30 + 20 = 50
      // 순: 150 - 50 = 100
      const result = service.calculateNetAdjustment(adjustments)

      expect(result).toBe(100)
    })

    it('빈 배열일 때 0을 반환한다', () => {
      const result = service.calculateNetAdjustment([])

      expect(result).toBe(0)
    })

    it('감소만 있을 때 음수를 반환한다', () => {
      const adjustments = [
        { type: 'DECREASE' as const, quantity: 50 },
        { type: 'DECREASE' as const, quantity: 30 },
      ]

      const result = service.calculateNetAdjustment(adjustments)

      expect(result).toBe(-80)
    })
  })

  describe('isStockLow', () => {
    it('CAUTION 또는 WARNING일 때 true를 반환한다', () => {
      expect(service.isStockLow(StockStatus.CAUTION)).toBe(true)
      expect(service.isStockLow(StockStatus.WARNING)).toBe(true)
    })

    it('NORMAL 또는 CRITICAL일 때 false를 반환한다', () => {
      expect(service.isStockLow(StockStatus.NORMAL)).toBe(false)
      expect(service.isStockLow(StockStatus.CRITICAL)).toBe(false)
    })
  })

  describe('needsAttention', () => {
    it('NORMAL이 아닐 때 true를 반환한다', () => {
      expect(service.needsAttention(StockStatus.CAUTION)).toBe(true)
      expect(service.needsAttention(StockStatus.WARNING)).toBe(true)
      expect(service.needsAttention(StockStatus.CRITICAL)).toBe(true)
    })

    it('NORMAL일 때 false를 반환한다', () => {
      expect(service.needsAttention(StockStatus.NORMAL)).toBe(false)
    })
  })

  describe('StockStatusThreshold', () => {
    it('상수 값이 올바르게 설정되어 있다', () => {
      expect(StockStatusThreshold.NORMAL).toBe(0.7)
      expect(StockStatusThreshold.CAUTION).toBe(0.5)
      expect(StockStatusThreshold.WARNING).toBe(0.3)
    })
  })
})
