import { describe, it, expect } from 'vitest'
import { PurchaseOrderLog } from '@domain/entities/PurchaseOrderLog'

describe('PurchaseOrderLog', () => {
  const createPurchaseOrderLog = (overrides = {}) => {
    return PurchaseOrderLog.create({
      id: 'log-001',
      orderId: 'order-001',
      prevStatus: 'DRAFT',
      newStatus: 'CONFIRMED',
      changedBy: 'admin',
      changedAt: new Date('2025-01-15'),
      remarks: 'Status changed',
      ...overrides,
    })
  }

  describe('create', () => {
    it('should create a valid PurchaseOrderLog', () => {
      const log = createPurchaseOrderLog()

      expect(log.id).toBe('log-001')
      expect(log.orderId).toBe('order-001')
      expect(log.prevStatus).toBe('DRAFT')
      expect(log.newStatus).toBe('CONFIRMED')
      expect(log.changedBy).toBe('admin')
      expect(log.changedAt.getTime()).toBe(new Date('2025-01-15').getTime())
      expect(log.remarks).toBe('Status changed')
    })

    it('should allow optional fields to be undefined', () => {
      const log = PurchaseOrderLog.create({
        id: 'log-002',
        orderId: 'order-001',
        changedAt: new Date('2025-01-15'),
      })

      expect(log.prevStatus).toBeUndefined()
      expect(log.newStatus).toBeUndefined()
      expect(log.changedBy).toBeUndefined()
      expect(log.remarks).toBeUndefined()
    })
  })

  describe('createStatusChange', () => {
    it('should create a status change log', () => {
      const log = PurchaseOrderLog.createStatusChange(
        'order-001',
        'DRAFT',
        'CONFIRMED',
        'admin',
        'Approved by manager'
      )

      expect(log.orderId).toBe('order-001')
      expect(log.prevStatus).toBe('DRAFT')
      expect(log.newStatus).toBe('CONFIRMED')
      expect(log.changedBy).toBe('admin')
      expect(log.remarks).toBe('Approved by manager')
      expect(log.id).toBeDefined()
      expect(log.changedAt).toBeInstanceOf(Date)
    })

    it('should create log without previous status (first status)', () => {
      const log = PurchaseOrderLog.createStatusChange(
        'order-001',
        undefined,
        'DRAFT',
        'system'
      )

      expect(log.orderId).toBe('order-001')
      expect(log.prevStatus).toBeUndefined()
      expect(log.newStatus).toBe('DRAFT')
    })

    it('should create log without changedBy and remarks', () => {
      const log = PurchaseOrderLog.createStatusChange(
        'order-001',
        'DRAFT',
        'CONFIRMED'
      )

      expect(log.orderId).toBe('order-001')
      expect(log.prevStatus).toBe('DRAFT')
      expect(log.newStatus).toBe('CONFIRMED')
      expect(log.changedBy).toBeUndefined()
      expect(log.remarks).toBeUndefined()
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      const log1 = createPurchaseOrderLog({ id: 'log-001' })
      const log2 = createPurchaseOrderLog({ id: 'log-001', remarks: 'Different remarks' })
      expect(log1.equals(log2)).toBe(true)
    })

    it('should return false for different id', () => {
      const log1 = createPurchaseOrderLog({ id: 'log-001' })
      const log2 = createPurchaseOrderLog({ id: 'log-002' })
      expect(log1.equals(log2)).toBe(false)
    })
  })
})
