import { describe, it, expect } from 'vitest'
import { VehicleModel } from '@domain/entities/VehicleModel'

describe('VehicleModel', () => {
  const createVehicleModel = (overrides = {}) => {
    return VehicleModel.create({
      id: 'vehicle-001',
      vehicleCode: 'V001',
      vehicleName: 'Sonata',
      description: 'Sonata DN8',
      isActive: true,
      ...overrides,
    })
  }

  describe('create', () => {
    it('should create a valid VehicleModel', () => {
      const model = createVehicleModel()

      expect(model.id).toBe('vehicle-001')
      expect(model.vehicleCode).toBe('V001')
      expect(model.vehicleName).toBe('Sonata')
      expect(model.description).toBe('Sonata DN8')
      expect(model.isActive).toBe(true)
    })

    it('should throw error when vehicleCode is empty', () => {
      expect(() => createVehicleModel({ vehicleCode: '' })).toThrow('차종 코드는 필수입니다')
    })

    it('should throw error when vehicleCode is whitespace only', () => {
      expect(() => createVehicleModel({ vehicleCode: '   ' })).toThrow('차종 코드는 필수입니다')
    })

    it('should throw error when vehicleName is empty', () => {
      expect(() => createVehicleModel({ vehicleName: '' })).toThrow('차종명은 필수입니다')
    })

    it('should throw error when vehicleName is whitespace only', () => {
      expect(() => createVehicleModel({ vehicleName: '   ' })).toThrow('차종명은 필수입니다')
    })

    it('should allow description to be undefined', () => {
      const model = createVehicleModel({ description: undefined })
      expect(model.description).toBeUndefined()
    })
  })

  describe('updateName', () => {
    it('should return new VehicleModel with updated name', () => {
      const model = createVehicleModel()
      const updated = model.updateName('Sonata NEW')

      expect(updated.vehicleName).toBe('Sonata NEW')
      expect(updated.vehicleCode).toBe('V001') // unchanged
      expect(model.vehicleName).toBe('Sonata') // original unchanged
    })
  })

  describe('updateDescription', () => {
    it('should return new VehicleModel with updated description', () => {
      const model = createVehicleModel()
      const updated = model.updateDescription('Updated description')

      expect(updated.description).toBe('Updated description')
      expect(updated.vehicleName).toBe('Sonata') // unchanged
    })
  })

  describe('deactivate', () => {
    it('should return new VehicleModel with isActive=false', () => {
      const model = createVehicleModel({ isActive: true })
      const deactivated = model.deactivate()

      expect(deactivated.isActive).toBe(false)
      expect(model.isActive).toBe(true) // original unchanged
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      const model1 = createVehicleModel({ id: 'vehicle-001' })
      const model2 = createVehicleModel({ id: 'vehicle-001', vehicleName: 'Different' })
      expect(model1.equals(model2)).toBe(true)
    })

    it('should return false for different id', () => {
      const model1 = createVehicleModel({ id: 'vehicle-001' })
      const model2 = createVehicleModel({ id: 'vehicle-002' })
      expect(model1.equals(model2)).toBe(false)
    })
  })

  describe('불변성', () => {
    it('updateName은 원본 유지', () => {
      const original = createVehicleModel({ vehicleName: 'Original' })
      const updated = original.updateName('Updated')

      expect(original.vehicleName).toBe('Original')
      expect(updated.vehicleName).toBe('Updated')
    })

    it('updateDescription은 원본 유지', () => {
      const original = createVehicleModel({ description: 'Original' })
      const updated = original.updateDescription('Updated')

      expect(original.description).toBe('Original')
      expect(updated.description).toBe('Updated')
    })

    it('deactivate은 원본 유지', () => {
      const original = createVehicleModel({ isActive: true })
      const deactivated = original.deactivate()

      expect(original.isActive).toBe(true)
      expect(deactivated.isActive).toBe(false)
    })
  })
})
