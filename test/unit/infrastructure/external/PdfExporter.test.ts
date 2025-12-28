/**
 * PdfExporter 테스트
 */

import { describe, it, expect } from 'vitest'
import { generateOrderHtml } from '@infrastructure/external/pdf/PdfExporter'
import { PurchaseOrder } from '@domain/entities/PurchaseOrder'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import { Money } from '@domain/valueObjects/Money'

// 샘플 발주 생성
const createSampleOrder = (): PurchaseOrder => {
  return PurchaseOrder.create({
    id: 'order-1',
    orderNumber: 'PO-20250101-001',
    orderDate: new Date('2025-01-01'),
    dueDate: new Date('2025-01-08'),
    partnerId: 'partner-1',
    companyId: 'company-1',
    orderType: 'DOMESTIC',
    status: OrderStatus.CONFIRMED,
    totalQuantity: 100,
    totalAmount: Money.create(100000, 'KRW'),
    notes: '테스트 비고',
  })
}

describe('PdfExporter', () => {
  describe('generateOrderHtml', () => {
    it('발주서 HTML을 생성해야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '테스트 거래처')

      expect(html).toContain('발 주 서')
      expect(html).toContain('PO-20250101-001')
      expect(html).toContain('테스트 거래처')
    })

    it('발주번호를 포함해야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '거래처')

      expect(html).toContain(order.orderNumber)
    })

    it('상태를 한글로 표시해야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '거래처')

      expect(html).toContain('확정')
    })

    it('국내 발주 유형을 표시해야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '거래처')

      expect(html).toContain('국내')
    })

    it('비고를 포함해야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '거래처')

      expect(html).toContain('테스트 비고')
    })

    it('회사명을 커스텀할 수 있어야 한다', () => {
      const order = createSampleOrder()
      const html = generateOrderHtml(order, '거래처', '커스텀 회사')

      expect(html).toContain('커스텀 회사')
    })

    it('베트남 발주의 선적일을 표시해야 한다', () => {
      const order = PurchaseOrder.create({
        id: 'order-vn',
        orderNumber: 'PO-20250101-002',
        orderDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-15'),
        shipmentDate: new Date('2025-01-10'),
        partnerId: 'partner-vn',
        companyId: 'company-1',
        orderType: 'VIETNAM',
        status: OrderStatus.DRAFT,
        totalQuantity: 200,
        totalAmount: Money.create(5000, 'USD'),
      })

      const html = generateOrderHtml(order, 'Vietnam Partner')

      expect(html).toContain('선적일')
      expect(html).toContain('베트남')
    })

    it('환율을 표시해야 한다 (있는 경우)', () => {
      const order = PurchaseOrder.create({
        id: 'order-vn',
        orderNumber: 'PO-20250101-002',
        orderDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-15'),
        shipmentDate: new Date('2025-01-10'),
        partnerId: 'partner-vn',
        companyId: 'company-1',
        orderType: 'VIETNAM',
        status: OrderStatus.DRAFT,
        totalQuantity: 200,
        totalAmount: Money.create(5000, 'USD'),
        exchangeRate: 1350,
      })

      const html = generateOrderHtml(order, 'Vietnam Partner')

      expect(html).toContain('적용 환율')
      expect(html).toContain('1,350')
    })
  })
})
