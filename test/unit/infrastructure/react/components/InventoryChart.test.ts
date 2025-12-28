/**
 * InventoryChart 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  transformInventoryChartData,
  getBarColor,
} from '@infrastructure/react/components/InventoryChart'
import type { MRPRecommendation } from '@infrastructure/react/hooks/useDashboard'

describe('InventoryChart 유틸리티', () => {
  describe('transformInventoryChartData', () => {
    it('MRP 권고 데이터를 차트 데이터로 변환', () => {
      const products: MRPRecommendation[] = [
        {
          productId: '1',
          productCode: 'PROD-001',
          productName: '제품1',
          currentStock: 50,
          reorderPoint: 100,
          recommendedQuantity: 70,
          supplierType: 'DOMESTIC',
        },
      ]

      const result = transformInventoryChartData(products)
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('currentStock')
      expect(result[0]).toHaveProperty('reorderPoint')
      expect(result[0]).toHaveProperty('gap')
    })

    it('긴 제품 코드는 10자로 자름', () => {
      const products: MRPRecommendation[] = [
        {
          productId: '1',
          productCode: 'VERY-LONG-PRODUCT-CODE-12345',
          productName: '제품1',
          currentStock: 50,
          reorderPoint: 100,
          recommendedQuantity: 70,
          supplierType: 'DOMESTIC',
        },
      ]

      const result = transformInventoryChartData(products)
      expect(result[0]!.name.length).toBeLessThanOrEqual(13) // 10 + "..."
      expect(result[0]!.name).toContain('...')
    })

    it('최대 8개 품목만 반환', () => {
      const products: MRPRecommendation[] = Array.from({ length: 15 }, (_, i) => ({
        productId: String(i + 1),
        productCode: `PROD-${String(i + 1).padStart(3, '0')}`,
        productName: `제품${i + 1}`,
        currentStock: 50,
        reorderPoint: 100,
        recommendedQuantity: 70,
        supplierType: 'DOMESTIC',
      }))

      const result = transformInventoryChartData(products)
      expect(result).toHaveLength(8)
    })

    it('gap 계산 검증', () => {
      const products: MRPRecommendation[] = [
        {
          productId: '1',
          productCode: 'PROD-001',
          productName: '제품1',
          currentStock: 30,
          reorderPoint: 100,
          recommendedQuantity: 90,
          supplierType: 'DOMESTIC',
        },
      ]

      const result = transformInventoryChartData(products)
      expect(result[0]!.gap).toBe(70) // 100 - 30
    })

    it('빈 배열은 빈 배열 반환', () => {
      const result = transformInventoryChartData([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getBarColor', () => {
    it('재고율 30% 미만은 red', () => {
      expect(getBarColor(20, 100)).toBe('#ef4444')
      expect(getBarColor(0, 100)).toBe('#ef4444')
    })

    it('재고율 30-50%는 orange', () => {
      expect(getBarColor(30, 100)).toBe('#f97316')
      expect(getBarColor(49, 100)).toBe('#f97316')
    })

    it('재고율 50-70%는 yellow', () => {
      expect(getBarColor(50, 100)).toBe('#eab308')
      expect(getBarColor(69, 100)).toBe('#eab308')
    })

    it('재고율 70% 이상은 green', () => {
      expect(getBarColor(70, 100)).toBe('#22c55e')
      expect(getBarColor(100, 100)).toBe('#22c55e')
    })
  })
})
