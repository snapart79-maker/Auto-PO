/**
 * OrderFormDialog 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  validateOrderForm,
  calculateTotalAmount,
  calculateTotalQuantity,
  ORDER_TYPE_OPTIONS,
  type OrderFormData,
  type OrderItemData,
} from '@infrastructure/react/components/OrderFormDialog'

// 테스트용 기본 품목 데이터
const defaultItem: OrderItemData = {
  productId: 'product-1',
  productCode: 'PROD-001',
  productName: '테스트 제품',
  quantity: 100,
  unitPrice: 1000,
  currency: 'KRW',
}

describe('OrderFormDialog 유틸리티', () => {
  describe('ORDER_TYPE_OPTIONS', () => {
    it('발주 유형 옵션이 정의되어야 한다', () => {
      const domestic = ORDER_TYPE_OPTIONS.find(opt => opt.value === 'DOMESTIC')
      const vietnam = ORDER_TYPE_OPTIONS.find(opt => opt.value === 'VIETNAM')

      expect(domestic?.label).toBe('국내')
      expect(vietnam?.label).toBe('베트남')
    })
  })

  describe('validateOrderForm', () => {
    const validFormData: OrderFormData = {
      partnerId: 'partner-1',
      orderType: 'DOMESTIC',
      dueDate: '2025-01-15',
      items: [defaultItem],
    }

    it('유효한 국내 발주 폼은 에러가 없어야 한다', () => {
      const errors = validateOrderForm(validFormData)
      expect(errors).toHaveLength(0)
    })

    it('거래처 미선택 시 에러', () => {
      const errors = validateOrderForm({ ...validFormData, partnerId: '' })
      expect(errors).toContain('거래처를 선택해주세요')
    })

    it('발주 유형 미선택 시 에러', () => {
      const errors = validateOrderForm({ ...validFormData, orderType: '' as 'DOMESTIC' })
      expect(errors).toContain('발주 유형을 선택해주세요')
    })

    it('납기일 미입력 시 에러', () => {
      const errors = validateOrderForm({ ...validFormData, dueDate: '' })
      expect(errors).toContain('납기일을 입력해주세요')
    })

    it('베트남 발주 시 선적일 필수', () => {
      const errors = validateOrderForm({
        ...validFormData,
        orderType: 'VIETNAM',
        shipmentDate: undefined,
      })
      expect(errors).toContain('베트남 발주는 선적일이 필수입니다')
    })

    it('베트남 발주에 선적일이 있으면 에러 없음', () => {
      const errors = validateOrderForm({
        ...validFormData,
        orderType: 'VIETNAM',
        shipmentDate: '2025-01-10',
      })
      expect(errors).not.toContain('베트남 발주는 선적일이 필수입니다')
    })

    it('품목이 없으면 에러', () => {
      const errors = validateOrderForm({ ...validFormData, items: [] })
      expect(errors).toContain('최소 1개 이상의 품목을 추가해주세요')
    })

    it('품목 수량이 0이면 에러', () => {
      const errors = validateOrderForm({
        ...validFormData,
        items: [{ ...defaultItem, quantity: 0 }],
      })
      expect(errors).toContain('품목 1: 수량은 0보다 커야 합니다')
    })

    it('품목 제품 미선택 시 에러', () => {
      const errors = validateOrderForm({
        ...validFormData,
        items: [{ ...defaultItem, productId: '' }],
      })
      expect(errors).toContain('품목 1: 제품을 선택해주세요')
    })

    it('품목 단가가 음수면 에러', () => {
      const errors = validateOrderForm({
        ...validFormData,
        items: [{ ...defaultItem, unitPrice: -100 }],
      })
      expect(errors).toContain('품목 1: 단가는 0 이상이어야 합니다')
    })
  })

  describe('calculateTotalAmount', () => {
    it('빈 배열은 0을 반환', () => {
      const total = calculateTotalAmount([])
      expect(total.amount).toBe(0)
    })

    it('단일 품목 금액 계산', () => {
      const items: OrderItemData[] = [
        {
          productId: 'p1',
          productCode: 'P001',
          productName: 'Product 1',
          quantity: 10,
          unitPrice: 1000,
          currency: 'KRW',
        },
      ]
      const total = calculateTotalAmount(items)
      expect(total.amount).toBe(10000)
    })

    it('복수 품목 금액 합계', () => {
      const items: OrderItemData[] = [
        {
          productId: 'p1',
          productCode: 'P001',
          productName: 'Product 1',
          quantity: 10,
          unitPrice: 1000,
          currency: 'KRW',
        },
        {
          productId: 'p2',
          productCode: 'P002',
          productName: 'Product 2',
          quantity: 5,
          unitPrice: 2000,
          currency: 'KRW',
        },
      ]
      const total = calculateTotalAmount(items)
      expect(total.amount).toBe(20000) // 10*1000 + 5*2000
    })

    it('USD 통화로 계산', () => {
      const items: OrderItemData[] = [
        {
          productId: 'p1',
          productCode: 'P001',
          productName: 'Product 1',
          quantity: 100,
          unitPrice: 10,
          currency: 'USD',
        },
      ]
      const total = calculateTotalAmount(items)
      expect(total.amount).toBe(1000)
      expect(total.currency).toBe('USD')
    })
  })

  describe('calculateTotalQuantity', () => {
    it('빈 배열은 0을 반환', () => {
      const total = calculateTotalQuantity([])
      expect(total).toBe(0)
    })

    it('단일 품목 수량', () => {
      const items: OrderItemData[] = [
        {
          productId: 'p1',
          productCode: 'P001',
          productName: 'Product 1',
          quantity: 50,
          unitPrice: 1000,
          currency: 'KRW',
        },
      ]
      const total = calculateTotalQuantity(items)
      expect(total).toBe(50)
    })

    it('복수 품목 수량 합계', () => {
      const items: OrderItemData[] = [
        {
          productId: 'p1',
          productCode: 'P001',
          productName: 'Product 1',
          quantity: 50,
          unitPrice: 1000,
          currency: 'KRW',
        },
        {
          productId: 'p2',
          productCode: 'P002',
          productName: 'Product 2',
          quantity: 30,
          unitPrice: 2000,
          currency: 'KRW',
        },
      ]
      const total = calculateTotalQuantity(items)
      expect(total).toBe(80)
    })
  })
})
