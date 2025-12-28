import { describe, it, expect, beforeEach } from 'vitest'
import { MRPCalculationService } from '@application/services/MRPCalculationService'

/**
 * MRPCalculationService Unit Tests
 *
 * Tests MRP (Material Requirements Planning) calculation logic for:
 * - Safety stock calculation with supplier-specific multipliers
 * - Net requirement calculation for order necessity determination
 * - Reorder point calculation for inventory replenishment triggers
 *
 * TDD Phase: RED - Tests written first, implementation pending
 */
describe('MRPCalculationService', () => {
  let service: MRPCalculationService

  beforeEach(() => {
    service = new MRPCalculationService()
  })

  describe('calculateSafetyStock', () => {
    /**
     * Safety Stock Formula: dailyAverage x leadTime x multiplier
     *
     * Multipliers:
     * - DOMESTIC (Korea): 1.2
     * - VIETNAM: 1.5 (higher due to longer supply chain uncertainty)
     */

    it('should calculate safety stock for domestic supplier (multiplier 1.2)', () => {
      // Arrange
      const dailyAverage = 100
      const leadTime = 5
      const domesticMultiplier = 1.2

      // Act
      const result = service.calculateSafetyStock(dailyAverage, leadTime, domesticMultiplier)

      // Assert
      // 100 x 5 x 1.2 = 600
      expect(result).toBe(600)
    })

    it('should calculate safety stock for Vietnam supplier (multiplier 1.5)', () => {
      // Arrange
      const dailyAverage = 100
      const leadTime = 5
      const vietnamMultiplier = 1.5

      // Act
      const result = service.calculateSafetyStock(dailyAverage, leadTime, vietnamMultiplier)

      // Assert
      // 100 x 5 x 1.5 = 750
      expect(result).toBe(750)
    })

    it('should return 0 when daily average is 0', () => {
      // Arrange
      const dailyAverage = 0
      const leadTime = 5
      const multiplier = 1.2

      // Act
      const result = service.calculateSafetyStock(dailyAverage, leadTime, multiplier)

      // Assert
      // 0 x 5 x 1.2 = 0
      expect(result).toBe(0)
    })

    it('should return 0 when lead time is 0', () => {
      // Arrange
      const dailyAverage = 100
      const leadTime = 0
      const multiplier = 1.2

      // Act
      const result = service.calculateSafetyStock(dailyAverage, leadTime, multiplier)

      // Assert
      // 100 x 0 x 1.2 = 0
      expect(result).toBe(0)
    })

    it('should handle decimal values and round to nearest integer', () => {
      // Arrange
      const dailyAverage = 33.5
      const leadTime = 3
      const multiplier = 1.2

      // Act
      const result = service.calculateSafetyStock(dailyAverage, leadTime, multiplier)

      // Assert
      // 33.5 x 3 x 1.2 = 120.6 -> rounds to 121
      expect(result).toBe(121)
    })
  })

  describe('calculateNetRequirement', () => {
    /**
     * Net Requirement Formula:
     * totalRequirement - currentStock - pendingOrders + safetyStock
     *
     * Result interpretation:
     * - Positive: Order needed (quantity = result)
     * - Zero or Negative: No order needed (sufficient inventory)
     */

    it('should calculate positive net requirement when order is needed', () => {
      // Arrange
      const totalRequirement = 1000
      const currentStock = 300
      const pendingOrders = 200
      const safetyStock = 600

      // Act
      const result = service.calculateNetRequirement(
        totalRequirement,
        currentStock,
        pendingOrders,
        safetyStock
      )

      // Assert
      // 1000 - 300 - 200 + 600 = 1100 (order 1100 units)
      expect(result).toBe(1100)
    })

    it('should calculate positive net requirement with high supply coverage', () => {
      // Arrange
      const totalRequirement = 1000
      const currentStock = 800
      const pendingOrders = 500
      const safetyStock = 600

      // Act
      const result = service.calculateNetRequirement(
        totalRequirement,
        currentStock,
        pendingOrders,
        safetyStock
      )

      // Assert
      // 1000 - 800 - 500 + 600 = 300 (still need to order 300 units)
      expect(result).toBe(300)
    })

    it('should calculate negative net requirement when no order needed', () => {
      // Arrange
      const totalRequirement = 1000
      const currentStock = 1500
      const pendingOrders = 200
      const safetyStock = 600

      // Act
      const result = service.calculateNetRequirement(
        totalRequirement,
        currentStock,
        pendingOrders,
        safetyStock
      )

      // Assert
      // 1000 - 1500 - 200 + 600 = -100 (excess inventory, no order needed)
      expect(result).toBe(-100)
    })

    it('should return 0 when all values are 0', () => {
      // Arrange
      const totalRequirement = 0
      const currentStock = 0
      const pendingOrders = 0
      const safetyStock = 0

      // Act
      const result = service.calculateNetRequirement(
        totalRequirement,
        currentStock,
        pendingOrders,
        safetyStock
      )

      // Assert
      // 0 - 0 - 0 + 0 = 0
      expect(result).toBe(0)
    })

    it('should handle safety stock only scenario', () => {
      // Arrange
      const totalRequirement = 0
      const currentStock = 0
      const pendingOrders = 0
      const safetyStock = 500

      // Act
      const result = service.calculateNetRequirement(
        totalRequirement,
        currentStock,
        pendingOrders,
        safetyStock
      )

      // Assert
      // 0 - 0 - 0 + 500 = 500 (need to build safety stock)
      expect(result).toBe(500)
    })
  })

  describe('calculateReorderPoint', () => {
    /**
     * Reorder Point Formula:
     * safetyStock + (dailyConsumption x leadTime)
     *
     * When current inventory falls below this point,
     * a new order should be triggered to prevent stockout.
     */

    it('should calculate reorder point with safety stock and consumption', () => {
      // Arrange
      const safetyStock = 600
      const dailyConsumption = 100
      const leadTime = 5

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 600 + (100 x 5) = 1100
      expect(result).toBe(1100)
    })

    it('should calculate reorder point with zero safety stock', () => {
      // Arrange
      const safetyStock = 0
      const dailyConsumption = 100
      const leadTime = 5

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 0 + (100 x 5) = 500
      expect(result).toBe(500)
    })

    it('should return safety stock when daily consumption is zero', () => {
      // Arrange
      const safetyStock = 600
      const dailyConsumption = 0
      const leadTime = 5

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 600 + (0 x 5) = 600
      expect(result).toBe(600)
    })

    it('should return safety stock when lead time is zero', () => {
      // Arrange
      const safetyStock = 600
      const dailyConsumption = 100
      const leadTime = 0

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 600 + (100 x 0) = 600
      expect(result).toBe(600)
    })

    it('should handle decimal values correctly', () => {
      // Arrange
      const safetyStock = 150.5
      const dailyConsumption = 25.3
      const leadTime = 4

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 150.5 + (25.3 x 4) = 150.5 + 101.2 = 251.7
      expect(result).toBeCloseTo(251.7, 2)
    })

    it('should return 0 when all values are 0', () => {
      // Arrange
      const safetyStock = 0
      const dailyConsumption = 0
      const leadTime = 0

      // Act
      const result = service.calculateReorderPoint(safetyStock, dailyConsumption, leadTime)

      // Assert
      // 0 + (0 x 0) = 0
      expect(result).toBe(0)
    })
  })

  describe('needsOrder', () => {
    /**
     * Determines if an order is needed based on current stock vs reorder point
     * - Returns true if currentStock <= reorderPoint
     * - Returns false if currentStock > reorderPoint
     */

    it('should return true when current stock is below reorder point', () => {
      // Arrange
      const currentStock = 500
      const reorderPoint = 1100

      // Act
      const result = service.needsOrder(currentStock, reorderPoint)

      // Assert
      expect(result).toBe(true)
    })

    it('should return true when current stock equals reorder point', () => {
      // Arrange
      const currentStock = 1100
      const reorderPoint = 1100

      // Act
      const result = service.needsOrder(currentStock, reorderPoint)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when current stock is above reorder point', () => {
      // Arrange
      const currentStock = 1500
      const reorderPoint = 1100

      // Act
      const result = service.needsOrder(currentStock, reorderPoint)

      // Assert
      expect(result).toBe(false)
    })

    it('should return true when both values are 0', () => {
      // Arrange
      const currentStock = 0
      const reorderPoint = 0

      // Act
      const result = service.needsOrder(currentStock, reorderPoint)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when current stock is positive and reorder point is 0', () => {
      // Arrange
      const currentStock = 100
      const reorderPoint = 0

      // Act
      const result = service.needsOrder(currentStock, reorderPoint)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getRecommendedQuantity', () => {
    /**
     * Returns the recommended order quantity
     * - Returns netRequirement if positive
     * - Returns 0 if netRequirement is zero or negative
     */

    it('should return net requirement when positive', () => {
      // Arrange
      const netRequirement = 500

      // Act
      const result = service.getRecommendedQuantity(netRequirement)

      // Assert
      expect(result).toBe(500)
    })

    it('should return 0 when net requirement is zero', () => {
      // Arrange
      const netRequirement = 0

      // Act
      const result = service.getRecommendedQuantity(netRequirement)

      // Assert
      expect(result).toBe(0)
    })

    it('should return 0 when net requirement is negative', () => {
      // Arrange
      const netRequirement = -200

      // Act
      const result = service.getRecommendedQuantity(netRequirement)

      // Assert
      expect(result).toBe(0)
    })

    it('should return large quantity for large net requirement', () => {
      // Arrange
      const netRequirement = 10000

      // Act
      const result = service.getRecommendedQuantity(netRequirement)

      // Assert
      expect(result).toBe(10000)
    })
  })

  describe('calculate (integration)', () => {
    /**
     * Tests the complete MRP calculation workflow
     * Combines all individual calculations into one result
     */

    it('should calculate complete MRP result for domestic supplier', () => {
      // Arrange
      const params = {
        dailyAverage: 100,
        leadTime: 5,
        multiplier: 1.2, // domestic
        totalRequirement: 500,
        currentStock: 300,
        pendingOrders: 100,
      }
      // Expected calculations:
      // safetyStock = 100 * 5 * 1.2 = 600
      // netRequirement = 500 - 300 - 100 + 600 = 700
      // reorderPoint = 600 + (100 * 5) = 1100
      // needsOrder = 300 <= 1100 = true
      // recommendedQuantity = max(0, 700) = 700

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(600)
      expect(result.netRequirement).toBe(700)
      expect(result.reorderPoint).toBe(1100)
      expect(result.needsOrder).toBe(true)
      expect(result.recommendedQuantity).toBe(700)
    })

    it('should calculate complete MRP result for Vietnam supplier', () => {
      // Arrange
      const params = {
        dailyAverage: 100,
        leadTime: 14,
        multiplier: 1.5, // Vietnam
        totalRequirement: 1000,
        currentStock: 500,
        pendingOrders: 200,
      }
      // Expected calculations:
      // safetyStock = 100 * 14 * 1.5 = 2100
      // netRequirement = 1000 - 500 - 200 + 2100 = 2400
      // reorderPoint = 2100 + (100 * 14) = 3500
      // needsOrder = 500 <= 3500 = true
      // recommendedQuantity = max(0, 2400) = 2400

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(2100)
      expect(result.netRequirement).toBe(2400)
      expect(result.reorderPoint).toBe(3500)
      expect(result.needsOrder).toBe(true)
      expect(result.recommendedQuantity).toBe(2400)
    })

    it('should return needsOrder=false when stock is sufficient', () => {
      // Arrange
      const params = {
        dailyAverage: 50,
        leadTime: 3,
        multiplier: 1.2,
        totalRequirement: 100,
        currentStock: 1000, // high stock
        pendingOrders: 500,
      }
      // Expected calculations:
      // safetyStock = 50 * 3 * 1.2 = 180
      // netRequirement = 100 - 1000 - 500 + 180 = -1220
      // reorderPoint = 180 + (50 * 3) = 330
      // needsOrder = 1000 <= 330 = false
      // recommendedQuantity = max(0, -1220) = 0

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(180)
      expect(result.netRequirement).toBe(-1220)
      expect(result.reorderPoint).toBe(330)
      expect(result.needsOrder).toBe(false)
      expect(result.recommendedQuantity).toBe(0)
    })

    it('should handle zero daily average', () => {
      // Arrange
      const params = {
        dailyAverage: 0,
        leadTime: 5,
        multiplier: 1.2,
        totalRequirement: 0,
        currentStock: 100,
        pendingOrders: 0,
      }
      // Expected calculations:
      // safetyStock = 0 * 5 * 1.2 = 0
      // netRequirement = 0 - 100 - 0 + 0 = -100
      // reorderPoint = 0 + (0 * 5) = 0
      // needsOrder = 100 <= 0 = false
      // recommendedQuantity = max(0, -100) = 0

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(0)
      expect(result.netRequirement).toBe(-100)
      expect(result.reorderPoint).toBe(0)
      expect(result.needsOrder).toBe(false)
      expect(result.recommendedQuantity).toBe(0)
    })

    it('should handle edge case with exact reorder point', () => {
      // Arrange
      const params = {
        dailyAverage: 100,
        leadTime: 5,
        multiplier: 1.2,
        totalRequirement: 500,
        currentStock: 1100, // exactly at reorder point
        pendingOrders: 0,
      }
      // Expected calculations:
      // safetyStock = 100 * 5 * 1.2 = 600
      // netRequirement = 500 - 1100 - 0 + 600 = 0
      // reorderPoint = 600 + (100 * 5) = 1100
      // needsOrder = 1100 <= 1100 = true
      // recommendedQuantity = max(0, 0) = 0

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(600)
      expect(result.netRequirement).toBe(0)
      expect(result.reorderPoint).toBe(1100)
      expect(result.needsOrder).toBe(true)
      expect(result.recommendedQuantity).toBe(0)
    })

    it('should handle negative daily average by returning 0 safety stock', () => {
      // Arrange
      const params = {
        dailyAverage: -50, // edge case
        leadTime: 5,
        multiplier: 1.2,
        totalRequirement: 100,
        currentStock: 200,
        pendingOrders: 0,
      }
      // When dailyAverage is negative, calculateSafetyStock returns 0

      // Act
      const result = service.calculate(params)

      // Assert
      expect(result.safetyStock).toBe(0)
    })
  })
})
