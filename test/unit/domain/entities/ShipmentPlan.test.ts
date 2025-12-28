import { describe, it, expect } from 'vitest'
import { ShipmentPlan } from '@domain/entities/ShipmentPlan'
import { Money } from '@domain/valueObjects/Money'

describe('ShipmentPlan', () => {
  const createShipmentPlan = (overrides = {}) => {
    return ShipmentPlan.create({
      id: 'plan-001',
      planDate: new Date('2025-01-15'),
      planType: 'DAILY',
      partnerId: 'partner-001',
      productId: 'product-001',
      vehicleModelId: 'vehicle-001',
      plannedQuantity: 100,
      unitPrice: Money.create(1000, 'KRW'),
      plannedAmount: Money.create(100000, 'KRW'),
      source: 'MANUAL',
      ...overrides,
    })
  }

  describe('create', () => {
    it('should create a valid ShipmentPlan', () => {
      const plan = createShipmentPlan()

      expect(plan.id).toBe('plan-001')
      expect(plan.planDate.getTime()).toBe(new Date('2025-01-15').getTime())
      expect(plan.planType).toBe('DAILY')
      expect(plan.partnerId).toBe('partner-001')
      expect(plan.productId).toBe('product-001')
      expect(plan.vehicleModelId).toBe('vehicle-001')
      expect(plan.plannedQuantity).toBe(100)
      expect(plan.unitPrice?.amount).toBe(1000)
      expect(plan.plannedAmount?.amount).toBe(100000)
      expect(plan.source).toBe('MANUAL')
    })

    it('should throw error when plannedQuantity is negative', () => {
      expect(() => createShipmentPlan({ plannedQuantity: -1 })).toThrow('계획 수량은 0 이상이어야 합니다')
    })

    it('should allow plannedQuantity to be zero', () => {
      const plan = createShipmentPlan({ plannedQuantity: 0 })
      expect(plan.plannedQuantity).toBe(0)
    })

    it('should allow optional fields to be undefined', () => {
      const plan = ShipmentPlan.create({
        id: 'plan-002',
        planDate: new Date('2025-01-15'),
        planType: 'WEEKLY',
        plannedQuantity: 50,
        source: 'UPLOAD',
      })

      expect(plan.partnerId).toBeUndefined()
      expect(plan.productId).toBeUndefined()
      expect(plan.vehicleModelId).toBeUndefined()
      expect(plan.unitPrice).toBeUndefined()
      expect(plan.plannedAmount).toBeUndefined()
    })
  })

  describe('updateQuantity', () => {
    it('should return new ShipmentPlan with updated quantity', () => {
      const plan = createShipmentPlan({ plannedQuantity: 100 })
      const updated = plan.updateQuantity(200)

      expect(updated.plannedQuantity).toBe(200)
      expect(plan.plannedQuantity).toBe(100) // original unchanged
    })
  })

  describe('planType helpers', () => {
    it('isDaily should return true for DAILY plan', () => {
      const plan = createShipmentPlan({ planType: 'DAILY' })
      expect(plan.isDaily()).toBe(true)
      expect(plan.isWeekly()).toBe(false)
      expect(plan.isMonthly()).toBe(false)
      expect(plan.isYearly()).toBe(false)
    })

    it('isWeekly should return true for WEEKLY plan', () => {
      const plan = createShipmentPlan({ planType: 'WEEKLY' })
      expect(plan.isDaily()).toBe(false)
      expect(plan.isWeekly()).toBe(true)
      expect(plan.isMonthly()).toBe(false)
      expect(plan.isYearly()).toBe(false)
    })

    it('isMonthly should return true for MONTHLY plan', () => {
      const plan = createShipmentPlan({ planType: 'MONTHLY' })
      expect(plan.isDaily()).toBe(false)
      expect(plan.isWeekly()).toBe(false)
      expect(plan.isMonthly()).toBe(true)
      expect(plan.isYearly()).toBe(false)
    })

    it('isYearly should return true for YEARLY plan', () => {
      const plan = createShipmentPlan({ planType: 'YEARLY' })
      expect(plan.isDaily()).toBe(false)
      expect(plan.isWeekly()).toBe(false)
      expect(plan.isMonthly()).toBe(false)
      expect(plan.isYearly()).toBe(true)
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      const plan1 = createShipmentPlan({ id: 'plan-001' })
      const plan2 = createShipmentPlan({ id: 'plan-001', plannedQuantity: 500 })
      expect(plan1.equals(plan2)).toBe(true)
    })

    it('should return false for different id', () => {
      const plan1 = createShipmentPlan({ id: 'plan-001' })
      const plan2 = createShipmentPlan({ id: 'plan-002' })
      expect(plan1.equals(plan2)).toBe(false)
    })
  })
})
