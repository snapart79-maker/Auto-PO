/**
 * CurrentInventory Entity Tests
 * TDD - RED Phase: 테스트 먼저 작성
 *
 * 현재고 상태를 표현하는 도메인 엔티티
 * 공식: 현재고 = 초기재고 + 입고 - 출고 ± 조정
 */

import { describe, it, expect } from 'vitest'
import {
  CurrentInventory,
  StockStatus,
  type CurrentInventoryProps,
} from '@domain/entities/CurrentInventory'

describe('CurrentInventory', () => {
  const validProps: CurrentInventoryProps = {
    productId: 'product-uuid-123',
    productCode: 'CODE-001',
    productName: '테스트 제품',
    vehicleName: '차종 A',
    initialQty: 100,
    inboundQty: 500,
    outboundQty: 300,
    adjustmentQty: 50, // 순 조정량 (증가 - 감소)
    safetyStock: 200,
  }

  describe('create', () => {
    it('유효한 props로 CurrentInventory를 생성한다', () => {
      const inventory = CurrentInventory.create(validProps)

      expect(inventory.productId).toBe(validProps.productId)
      expect(inventory.productCode).toBe(validProps.productCode)
      expect(inventory.productName).toBe(validProps.productName)
      expect(inventory.vehicleName).toBe(validProps.vehicleName)
      expect(inventory.initialQty).toBe(100)
      expect(inventory.inboundQty).toBe(500)
      expect(inventory.outboundQty).toBe(300)
      expect(inventory.adjustmentQty).toBe(50)
      expect(inventory.safetyStock).toBe(200)
    })

    it('safetyStock이 없으면 0으로 설정된다', () => {
      const { safetyStock, ...propsWithoutSafety } = validProps
      const inventory = CurrentInventory.create(propsWithoutSafety)

      expect(inventory.safetyStock).toBe(0)
    })

    it('vehicleName이 없어도 생성된다', () => {
      const { vehicleName, ...propsWithoutVehicle } = validProps
      const inventory = CurrentInventory.create(propsWithoutVehicle)

      expect(inventory.vehicleName).toBeUndefined()
    })
  })

  describe('currentQty 계산', () => {
    it('현재고 = 초기재고 + 입고 - 출고 + 조정', () => {
      // 100 + 500 - 300 + 50 = 350
      const inventory = CurrentInventory.create(validProps)

      expect(inventory.currentQty).toBe(350)
    })

    it('조정이 음수일 때도 계산된다', () => {
      const props = { ...validProps, adjustmentQty: -30 }
      // 100 + 500 - 300 - 30 = 270
      const inventory = CurrentInventory.create(props)

      expect(inventory.currentQty).toBe(270)
    })

    it('모든 값이 0일 때 현재고도 0이다', () => {
      const props = {
        ...validProps,
        initialQty: 0,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.currentQty).toBe(0)
    })

    it('출고가 입고보다 많으면 음수가 될 수 있다', () => {
      const props = {
        ...validProps,
        initialQty: 0,
        inboundQty: 100,
        outboundQty: 200,
        adjustmentQty: 0,
      }
      // 0 + 100 - 200 + 0 = -100
      const inventory = CurrentInventory.create(props)

      expect(inventory.currentQty).toBe(-100)
    })
  })

  describe('getStockStatus', () => {
    it('현재고 >= 안전재고 × 70%일 때 NORMAL', () => {
      // safetyStock = 200, 70% = 140
      // currentQty = 350 >= 140 → NORMAL
      const inventory = CurrentInventory.create(validProps)

      expect(inventory.getStockStatus()).toBe(StockStatus.NORMAL)
    })

    it('안전재고 × 50% <= 현재고 < 안전재고 × 70%일 때 CAUTION', () => {
      // safetyStock = 200, 70% = 140, 50% = 100
      // 110 >= 100 && 110 < 140 → CAUTION
      const props = {
        ...validProps,
        initialQty: 10,
        inboundQty: 100,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props) // currentQty = 110

      expect(inventory.getStockStatus()).toBe(StockStatus.CAUTION)
    })

    it('안전재고 × 30% <= 현재고 < 안전재고 × 50%일 때 WARNING', () => {
      // safetyStock = 200, 50% = 100, 30% = 60
      // 70 >= 60 && 70 < 100 → WARNING
      const props = {
        ...validProps,
        initialQty: 70,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockStatus()).toBe(StockStatus.WARNING)
    })

    it('현재고 < 안전재고 × 30%일 때 CRITICAL', () => {
      // safetyStock = 200, 30% = 60
      // 50 < 60 → CRITICAL
      const props = {
        ...validProps,
        initialQty: 50,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockStatus()).toBe(StockStatus.CRITICAL)
    })

    it('안전재고가 0일 때 현재고가 있으면 NORMAL', () => {
      const props = { ...validProps, safetyStock: 0 }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockStatus()).toBe(StockStatus.NORMAL)
    })

    it('현재고가 음수일 때 CRITICAL', () => {
      const props = {
        ...validProps,
        initialQty: 0,
        inboundQty: 0,
        outboundQty: 100,
        adjustmentQty: 0,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockStatus()).toBe(StockStatus.CRITICAL)
    })
  })

  describe('getStockRatio', () => {
    it('현재고 / 안전재고 비율을 반환한다', () => {
      // currentQty = 350, safetyStock = 200
      // ratio = 350 / 200 = 1.75
      const inventory = CurrentInventory.create(validProps)

      expect(inventory.getStockRatio()).toBe(1.75)
    })

    it('안전재고가 0일 때 Infinity를 반환한다', () => {
      const props = { ...validProps, safetyStock: 0 }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockRatio()).toBe(Infinity)
    })

    it('현재고가 0일 때 0을 반환한다', () => {
      const props = {
        ...validProps,
        initialQty: 0,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.getStockRatio()).toBe(0)
    })
  })

  describe('isNormal / isLow / isCritical', () => {
    it('정상 상태일 때 isNormal()이 true를 반환한다', () => {
      const inventory = CurrentInventory.create(validProps)

      expect(inventory.isNormal()).toBe(true)
      expect(inventory.isLow()).toBe(false)
      expect(inventory.isCritical()).toBe(false)
    })

    it('주의 상태일 때 isLow()가 true를 반환한다', () => {
      const props = {
        ...validProps,
        initialQty: 110,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.isNormal()).toBe(false)
      expect(inventory.isLow()).toBe(true)
      expect(inventory.isCritical()).toBe(false)
    })

    it('경고 상태일 때 isLow()가 true를 반환한다', () => {
      const props = {
        ...validProps,
        initialQty: 70,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.isNormal()).toBe(false)
      expect(inventory.isLow()).toBe(true)
      expect(inventory.isCritical()).toBe(false)
    })

    it('위험 상태일 때 isCritical()이 true를 반환한다', () => {
      const props = {
        ...validProps,
        initialQty: 30,
        inboundQty: 0,
        outboundQty: 0,
        adjustmentQty: 0,
        safetyStock: 200,
      }
      const inventory = CurrentInventory.create(props)

      expect(inventory.isNormal()).toBe(false)
      expect(inventory.isLow()).toBe(false)
      expect(inventory.isCritical()).toBe(true)
    })
  })

  describe('getStatusLabel', () => {
    it('각 상태에 맞는 한글 라벨을 반환한다', () => {
      const testCases = [
        { currentQty: 350, safetyStock: 200, expected: '정상' }, // NORMAL
        { currentQty: 110, safetyStock: 200, expected: '주의' }, // CAUTION
        { currentQty: 70, safetyStock: 200, expected: '경고' }, // WARNING
        { currentQty: 30, safetyStock: 200, expected: '위험' }, // CRITICAL
      ]

      testCases.forEach(({ currentQty, safetyStock, expected }) => {
        const props = {
          ...validProps,
          initialQty: currentQty,
          inboundQty: 0,
          outboundQty: 0,
          adjustmentQty: 0,
          safetyStock,
        }
        const inventory = CurrentInventory.create(props)
        expect(inventory.getStatusLabel()).toBe(expected)
      })
    })
  })

  describe('getStatusColor', () => {
    it('각 상태에 맞는 색상 코드를 반환한다', () => {
      const testCases = [
        { currentQty: 350, safetyStock: 200, expected: '#22C55E' }, // 정상 - 초록
        { currentQty: 110, safetyStock: 200, expected: '#F59E0B' }, // 주의 - 노랑
        { currentQty: 70, safetyStock: 200, expected: '#F97316' }, // 경고 - 주황
        { currentQty: 30, safetyStock: 200, expected: '#EF4444' }, // 위험 - 빨강
      ]

      testCases.forEach(({ currentQty, safetyStock, expected }) => {
        const props = {
          ...validProps,
          initialQty: currentQty,
          inboundQty: 0,
          outboundQty: 0,
          adjustmentQty: 0,
          safetyStock,
        }
        const inventory = CurrentInventory.create(props)
        expect(inventory.getStatusColor()).toBe(expected)
      })
    })
  })

  describe('toPlainObject', () => {
    it('엔티티를 일반 객체로 변환한다', () => {
      const inventory = CurrentInventory.create(validProps)
      const plain = inventory.toPlainObject()

      expect(plain.productId).toBe(validProps.productId)
      expect(plain.productCode).toBe(validProps.productCode)
      expect(plain.productName).toBe(validProps.productName)
      expect(plain.vehicleName).toBe(validProps.vehicleName)
      expect(plain.initialQty).toBe(100)
      expect(plain.inboundQty).toBe(500)
      expect(plain.outboundQty).toBe(300)
      expect(plain.adjustmentQty).toBe(50)
      expect(plain.currentQty).toBe(350)
      expect(plain.safetyStock).toBe(200)
      expect(plain.stockStatus).toBe(StockStatus.NORMAL)
      expect(plain.stockRatio).toBe(1.75)
    })
  })

  describe('equals', () => {
    it('같은 productId를 가진 인벤토리는 동일하다', () => {
      const inv1 = CurrentInventory.create(validProps)
      const inv2 = CurrentInventory.create({ ...validProps, inboundQty: 1000 })

      expect(inv1.equals(inv2)).toBe(true)
    })

    it('다른 productId를 가진 인벤토리는 다르다', () => {
      const inv1 = CurrentInventory.create(validProps)
      const inv2 = CurrentInventory.create({ ...validProps, productId: 'different-id' })

      expect(inv1.equals(inv2)).toBe(false)
    })
  })
})
