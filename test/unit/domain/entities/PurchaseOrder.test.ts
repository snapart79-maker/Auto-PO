import { describe, it, expect } from 'vitest'
import { PurchaseOrder, PurchaseOrderProps, OrderType } from '@domain/entities/PurchaseOrder'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import { Money } from '@domain/valueObjects/Money'

describe('PurchaseOrder Entity', () => {
  const validProps: PurchaseOrderProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    orderNumber: 'PO-20250127-001',
    orderDate: new Date('2025-01-27'),
    dueDate: new Date('2025-02-03'),
    partnerId: 'partner-123',
    companyId: 'company-123',
    orderType: 'DOMESTIC' as OrderType,
    status: OrderStatus.DRAFT,
    totalQuantity: 1000,
    totalAmount: Money.create(6830000, 'KRW'),
  }

  describe('생성', () => {
    it('유효한 속성으로 PurchaseOrder 생성 성공', () => {
      const order = PurchaseOrder.create(validProps)

      expect(order.orderNumber).toBe('PO-20250127-001')
      expect(order.status.value).toBe('DRAFT')
      expect(order.orderType).toBe('DOMESTIC')
    })

    it('발주번호 형식: PO-YYYYMMDD-NNN', () => {
      const orderNumber = PurchaseOrder.generateOrderNumber(new Date('2025-01-27'), 1)
      expect(orderNumber).toBe('PO-20250127-001')
    })

    it('초기 상태는 DRAFT', () => {
      const order = PurchaseOrder.create(validProps)
      expect(order.status.isDraft()).toBe(true)
    })

    it('베트남 발주는 선적일 필수', () => {
      expect(() => PurchaseOrder.create({
        ...validProps,
        orderType: 'VIETNAM' as OrderType,
        shipmentDate: undefined,
      })).toThrow('베트남 발주는 선적일이 필수입니다')
    })

    it('베트남 발주 선적일 포함', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        orderType: 'VIETNAM' as OrderType,
        shipmentDate: new Date('2025-02-10'),
      })

      expect(order.shipmentDate).toEqual(new Date('2025-02-10'))
    })
  })

  describe('상태 변경', () => {
    it('DRAFT → CONFIRMED 성공', () => {
      const order = PurchaseOrder.create(validProps)
      const confirmed = order.confirm()

      expect(confirmed.status.value).toBe('CONFIRMED')
    })

    it('CONFIRMED → SENT 성공', () => {
      const confirmed = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CONFIRMED,
      })
      const sent = confirmed.send()

      expect(sent.status.value).toBe('SENT')
    })

    it('SENT → PARTIALLY_RECEIVED 성공', () => {
      const sent = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.SENT,
      })
      const partial = sent.receivePartially()

      expect(partial.status.value).toBe('PARTIALLY_RECEIVED')
    })

    it('SENT → COMPLETED 성공', () => {
      const sent = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.SENT,
      })
      const completed = sent.complete()

      expect(completed.status.value).toBe('COMPLETED')
    })

    it('DRAFT → CANCELLED 성공', () => {
      const order = PurchaseOrder.create(validProps)
      const cancelled = order.cancel()

      expect(cancelled.status.value).toBe('CANCELLED')
    })

    it('COMPLETED에서는 상태 변경 불가', () => {
      const completed = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.COMPLETED,
      })

      expect(() => completed.cancel()).toThrow('완료된 발주는 취소할 수 없습니다')
    })

    it('CANCELLED에서는 상태 변경 불가', () => {
      const cancelled = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CANCELLED,
      })

      expect(() => cancelled.confirm()).toThrow('취소된 발주는 확정할 수 없습니다')
    })
  })

  describe('편집 가능 여부', () => {
    it('DRAFT는 편집 가능', () => {
      const order = PurchaseOrder.create(validProps)
      expect(order.isEditable()).toBe(true)
    })

    it('CONFIRMED는 편집 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CONFIRMED,
      })
      expect(order.isEditable()).toBe(false)
    })
  })

  describe('금액 계산', () => {
    it('총수량과 총금액', () => {
      const order = PurchaseOrder.create(validProps)

      expect(order.totalQuantity).toBe(1000)
      expect(order.totalAmount?.amount).toBe(6830000)
    })
  })

  describe('발주 유형 확인', () => {
    it('국내 발주 확인', () => {
      const order = PurchaseOrder.create(validProps)
      expect(order.isDomestic()).toBe(true)
      expect(order.isVietnam()).toBe(false)
    })

    it('베트남 발주 확인', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        orderType: 'VIETNAM' as OrderType,
        shipmentDate: new Date('2025-02-10'),
      })
      expect(order.isVietnam()).toBe(true)
      expect(order.isDomestic()).toBe(false)
    })
  })

  describe('상태 변경 에러 케이스', () => {
    it('DRAFT에서 SENT 불가', () => {
      const order = PurchaseOrder.create(validProps)
      expect(() => order.send()).toThrow('현재 상태에서 발송할 수 없습니다')
    })

    it('DRAFT에서 부분입고 불가', () => {
      const order = PurchaseOrder.create(validProps)
      expect(() => order.receivePartially()).toThrow('현재 상태에서 부분 입고 처리할 수 없습니다')
    })

    it('DRAFT에서 완료 불가', () => {
      const order = PurchaseOrder.create(validProps)
      expect(() => order.complete()).toThrow('현재 상태에서 완료할 수 없습니다')
    })

    it('CONFIRMED에서 부분입고 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CONFIRMED,
      })
      expect(() => order.receivePartially()).toThrow('현재 상태에서 부분 입고 처리할 수 없습니다')
    })

    it('CONFIRMED에서 완료 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CONFIRMED,
      })
      expect(() => order.complete()).toThrow('현재 상태에서 완료할 수 없습니다')
    })

    it('PARTIALLY_RECEIVED에서 확정 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.PARTIALLY_RECEIVED,
      })
      expect(() => order.confirm()).toThrow('현재 상태에서 확정할 수 없습니다')
    })

    it('PARTIALLY_RECEIVED에서 발송 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.PARTIALLY_RECEIVED,
      })
      expect(() => order.send()).toThrow('현재 상태에서 발송할 수 없습니다')
    })

    it('CANCELLED에서 취소 불가', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.CANCELLED,
      })
      expect(() => order.cancel()).toThrow('현재 상태에서 취소할 수 없습니다')
    })
  })

  describe('PARTIALLY_RECEIVED 상태 전이', () => {
    it('PARTIALLY_RECEIVED → COMPLETED 성공', () => {
      const partial = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.PARTIALLY_RECEIVED,
      })
      const completed = partial.complete()
      expect(completed.status.value).toBe('COMPLETED')
    })

    it('PARTIALLY_RECEIVED → CANCELLED 성공', () => {
      const partial = PurchaseOrder.create({
        ...validProps,
        status: OrderStatus.PARTIALLY_RECEIVED,
      })
      const cancelled = partial.cancel()
      expect(cancelled.status.value).toBe('CANCELLED')
    })
  })

  describe('동등성 비교 (equals)', () => {
    it('같은 ID는 동등', () => {
      const order1 = PurchaseOrder.create(validProps)
      const order2 = PurchaseOrder.create(validProps)
      expect(order1.equals(order2)).toBe(true)
    })

    it('다른 ID는 동등하지 않음', () => {
      const order1 = PurchaseOrder.create(validProps)
      const order2 = PurchaseOrder.create({
        ...validProps,
        id: 'different-id',
      })
      expect(order1.equals(order2)).toBe(false)
    })
  })

  describe('Getter 속성', () => {
    it('모든 속성 접근 가능', () => {
      const order = PurchaseOrder.create({
        ...validProps,
        exchangeRate: 1350,
        notes: '테스트 발주',
      })

      expect(order.id).toBe(validProps.id)
      expect(order.orderNumber).toBe(validProps.orderNumber)
      expect(order.orderDate).toEqual(validProps.orderDate)
      expect(order.dueDate).toEqual(validProps.dueDate)
      expect(order.partnerId).toBe(validProps.partnerId)
      expect(order.companyId).toBe(validProps.companyId)
      expect(order.orderType).toBe(validProps.orderType)
      expect(order.exchangeRate).toBe(1350)
      expect(order.notes).toBe('테스트 발주')
    })
  })

  describe('발주번호 생성', () => {
    it('시퀀스가 100일 때', () => {
      const orderNumber = PurchaseOrder.generateOrderNumber(new Date('2025-12-31'), 100)
      expect(orderNumber).toBe('PO-20251231-100')
    })

    it('월과 일이 한 자리수일 때 패딩', () => {
      const orderNumber = PurchaseOrder.generateOrderNumber(new Date('2025-01-01'), 1)
      expect(orderNumber).toBe('PO-20250101-001')
    })
  })
})
