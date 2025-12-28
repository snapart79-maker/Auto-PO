import { describe, it, expect } from 'vitest'
import { InventoryTransaction } from '@domain/entities/InventoryTransaction'
import { Money } from '@domain/valueObjects/Money'

describe('InventoryTransaction', () => {
  const createInventoryTransaction = (overrides = {}) => {
    return InventoryTransaction.create({
      id: 'txn-001',
      transactionDate: new Date('2025-01-15'),
      transactionType: 'IN',
      partnerId: 'partner-001',
      productId: 'product-001',
      quantity: 100,
      unitPrice: Money.create(1000, 'KRW'),
      supplyAmount: Money.create(100000, 'KRW'),
      exchangeRate: 1350.0,
      totalAmount: Money.create(100000, 'KRW'),
      itemType: '원재료',
      uploadBatchId: 'batch-001',
      ...overrides,
    })
  }

  describe('create', () => {
    it('should create a valid InventoryTransaction', () => {
      const txn = createInventoryTransaction()

      expect(txn.id).toBe('txn-001')
      expect(txn.transactionDate.getTime()).toBe(new Date('2025-01-15').getTime())
      expect(txn.transactionType).toBe('IN')
      expect(txn.partnerId).toBe('partner-001')
      expect(txn.productId).toBe('product-001')
      expect(txn.quantity).toBe(100)
      expect(txn.unitPrice?.amount).toBe(1000)
      expect(txn.supplyAmount?.amount).toBe(100000)
      expect(txn.exchangeRate).toBe(1350.0)
      expect(txn.totalAmount?.amount).toBe(100000)
      expect(txn.itemType).toBe('원재료')
      expect(txn.uploadBatchId).toBe('batch-001')
    })

    it('should throw error when quantity is zero', () => {
      expect(() => createInventoryTransaction({ quantity: 0 })).toThrow('수량은 0보다 커야 합니다')
    })

    it('should throw error when quantity is negative', () => {
      expect(() => createInventoryTransaction({ quantity: -10 })).toThrow('수량은 0보다 커야 합니다')
    })

    it('should allow optional fields to be undefined', () => {
      const txn = InventoryTransaction.create({
        id: 'txn-002',
        transactionDate: new Date('2025-01-15'),
        transactionType: 'OUT',
        quantity: 50,
      })

      expect(txn.partnerId).toBeUndefined()
      expect(txn.productId).toBeUndefined()
      expect(txn.unitPrice).toBeUndefined()
      expect(txn.supplyAmount).toBeUndefined()
      expect(txn.exchangeRate).toBeUndefined()
      expect(txn.totalAmount).toBeUndefined()
      expect(txn.itemType).toBeUndefined()
      expect(txn.uploadBatchId).toBeUndefined()
    })
  })

  describe('isInbound', () => {
    it('should return true for IN transaction', () => {
      const txn = createInventoryTransaction({ transactionType: 'IN' })
      expect(txn.isInbound()).toBe(true)
    })

    it('should return false for OUT transaction', () => {
      const txn = createInventoryTransaction({ transactionType: 'OUT' })
      expect(txn.isInbound()).toBe(false)
    })
  })

  describe('isOutbound', () => {
    it('should return true for OUT transaction', () => {
      const txn = createInventoryTransaction({ transactionType: 'OUT' })
      expect(txn.isOutbound()).toBe(true)
    })

    it('should return false for IN transaction', () => {
      const txn = createInventoryTransaction({ transactionType: 'IN' })
      expect(txn.isOutbound()).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      const txn1 = createInventoryTransaction({ id: 'txn-001' })
      const txn2 = createInventoryTransaction({ id: 'txn-001', quantity: 500 })
      expect(txn1.equals(txn2)).toBe(true)
    })

    it('should return false for different id', () => {
      const txn1 = createInventoryTransaction({ id: 'txn-001' })
      const txn2 = createInventoryTransaction({ id: 'txn-002' })
      expect(txn1.equals(txn2)).toBe(false)
    })
  })
})
