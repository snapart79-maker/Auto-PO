/**
 * ExcelExporter 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  orderToExportRow,
  ordersToWorkbook,
  orderDetailToWorkbook,
  workbookToArrayBuffer,
} from '@infrastructure/external/excel/ExcelExporter'
import { PurchaseOrder } from '@domain/entities/PurchaseOrder'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import { Money } from '@domain/valueObjects/Money'

// 샘플 발주 생성
const createSampleOrder = (overrides: Partial<{
  id: string
  orderNumber: string
  orderType: 'DOMESTIC' | 'VIETNAM'
  status: OrderStatus
  totalQuantity: number
  totalAmount: Money
}> = {}): PurchaseOrder => {
  return PurchaseOrder.create({
    id: overrides.id ?? 'order-1',
    orderNumber: overrides.orderNumber ?? 'PO-20250101-001',
    orderDate: new Date('2025-01-01'),
    dueDate: new Date('2025-01-08'),
    partnerId: 'partner-1',
    companyId: 'company-1',
    orderType: overrides.orderType ?? 'DOMESTIC',
    status: overrides.status ?? OrderStatus.DRAFT,
    totalQuantity: overrides.totalQuantity ?? 100,
    totalAmount: overrides.totalAmount ?? Money.create(100000, 'KRW'),
  })
}

describe('ExcelExporter', () => {
  describe('orderToExportRow', () => {
    it('발주를 Excel 행 데이터로 변환해야 한다', () => {
      const order = createSampleOrder()
      const row = orderToExportRow(order, '테스트 거래처')

      expect(row.orderNumber).toBe('PO-20250101-001')
      expect(row.partnerName).toBe('테스트 거래처')
      expect(row.orderType).toBe('국내')
      expect(row.status).toBe('초안')
      expect(row.totalQuantity).toBe(100)
    })

    it('베트남 발주도 올바르게 변환해야 한다', () => {
      const order = PurchaseOrder.create({
        id: 'order-vietnam',
        orderNumber: 'PO-20250101-002',
        orderDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-15'),
        shipmentDate: new Date('2025-01-10'),
        partnerId: 'partner-vn',
        companyId: 'company-1',
        orderType: 'VIETNAM',
        status: OrderStatus.CONFIRMED,
        totalQuantity: 500,
        totalAmount: Money.create(1000, 'USD'),
      })

      const row = orderToExportRow(order, 'Vietnam Partner')

      expect(row.orderType).toBe('베트남')
      expect(row.status).toBe('확정')
      expect(row.shipmentDate).toBeDefined()
      expect(row.currency).toBe('USD')
    })
  })

  describe('ordersToWorkbook', () => {
    it('발주 목록을 워크북으로 변환해야 한다', () => {
      const orders = [
        createSampleOrder({ id: 'order-1', orderNumber: 'PO-20250101-001' }),
        createSampleOrder({ id: 'order-2', orderNumber: 'PO-20250101-002' }),
      ]

      const getPartnerName = (id: string) => `Partner ${id}`
      const workbook = ordersToWorkbook(orders, getPartnerName)

      expect(workbook.SheetNames).toContain('발주목록')
    })

    it('빈 목록도 처리해야 한다', () => {
      const workbook = ordersToWorkbook([], () => '')

      expect(workbook.SheetNames).toContain('발주목록')
    })
  })

  describe('orderDetailToWorkbook', () => {
    it('단일 발주를 상세 워크북으로 변환해야 한다', () => {
      const order = createSampleOrder()
      const workbook = orderDetailToWorkbook(order, '테스트 거래처')

      expect(workbook.SheetNames).toContain('발주정보')
    })
  })

  describe('workbookToArrayBuffer', () => {
    it('워크북을 ArrayBuffer로 변환해야 한다', () => {
      const orders = [createSampleOrder()]
      const workbook = ordersToWorkbook(orders, () => '거래처')
      const buffer = workbookToArrayBuffer(workbook)

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })
  })
})
