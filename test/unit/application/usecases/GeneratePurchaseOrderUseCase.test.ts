/**
 * GeneratePurchaseOrderUseCase Unit Tests
 * RED Phase: These tests will FAIL until implementation is complete
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeneratePurchaseOrderUseCase, OrderItem } from '@application/usecases/GeneratePurchaseOrderUseCase'
import { Money } from '@domain/valueObjects/Money'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import type { IPartnerRepository } from '@domain/repositories/IPartnerRepository'
import type { Partner } from '@domain/entities/Partner'

describe('GeneratePurchaseOrderUseCase', () => {
  let useCase: GeneratePurchaseOrderUseCase
  let mockOrderRepository: IOrderRepository
  let mockPartnerRepository: IPartnerRepository
  let mockPartner: Partner

  beforeEach(() => {
    // Mock Partner
    mockPartner = {
      id: 'partner-001',
      partnerCode: 'SUP-001',
      partnerName: 'Test Supplier',
      partnerType: { value: 'SUPPLIER' },
      isActive: true,
    } as unknown as Partner

    // Mock repositories
    mockOrderRepository = {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findAll: vi.fn(),
      findByPartner: vi.fn(),
      findPending: vi.fn(),
      getPendingQuantity: vi.fn(),
      getPendingQuantities: vi.fn(),
      getNextSequence: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      saveLog: vi.fn(),
      findLogsByOrderId: vi.fn(),
    }

    mockPartnerRepository = {
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      findByType: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      delete: vi.fn(),
      existsByCode: vi.fn(),
    }

    // Default mock implementations
    vi.mocked(mockPartnerRepository.findById).mockResolvedValue(mockPartner)
    vi.mocked(mockOrderRepository.getNextSequence).mockResolvedValue(1)
    vi.mocked(mockOrderRepository.save).mockImplementation(async (order) => order)

    // Use deps object for constructor
    useCase = new GeneratePurchaseOrderUseCase({
      orderRepository: mockOrderRepository,
      partnerRepository: mockPartnerRepository,
    })
  })

  describe('발주번호 생성: PO-YYYYMMDD-NNN 형식', () => {
    it('2025-01-27, 시퀀스 1 → PO-20250127-001', async () => {
      vi.mocked(mockOrderRepository.getNextSequence).mockResolvedValue(1)

      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      expect(result.orderNumber).toMatch(/^PO-\d{8}-001$/)
    })

    it('2025-01-27, 시퀀스 15 → PO-20250127-015', async () => {
      vi.mocked(mockOrderRepository.getNextSequence).mockResolvedValue(15)

      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      expect(result.orderNumber).toMatch(/^PO-\d{8}-015$/)
    })
  })

  describe('초기 상태는 DRAFT', () => {
    it('생성된 발주의 상태는 DRAFT', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      expect(result.status.equals(OrderStatus.DRAFT)).toBe(true)
      expect(result.status.isDraft()).toBe(true)
    })
  })

  describe('총수량 계산: sum(items.quantity)', () => {
    it('items: [100, 200, 300] → totalQuantity: 600', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
        {
          productId: 'prod-002',
          productCode: 'PRD-002',
          productName: 'Wire Harness B',
          quantity: 200,
          unitPrice: Money.create(2000, 'KRW'),
        },
        {
          productId: 'prod-003',
          productCode: 'PRD-003',
          productName: 'Wire Harness C',
          quantity: 300,
          unitPrice: Money.create(3000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      expect(result.totalQuantity).toBe(600)
    })
  })

  describe('총금액 계산: sum(items.quantity * items.unitPrice)', () => {
    it('100 * 1000 + 200 * 2000 + 300 * 3000 = 1,400,000', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
        {
          productId: 'prod-002',
          productCode: 'PRD-002',
          productName: 'Wire Harness B',
          quantity: 200,
          unitPrice: Money.create(2000, 'KRW'),
        },
        {
          productId: 'prod-003',
          productCode: 'PRD-003',
          productName: 'Wire Harness C',
          quantity: 300,
          unitPrice: Money.create(3000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      // 100 * 1000 = 100,000
      // 200 * 2000 = 400,000
      // 300 * 3000 = 900,000
      // Total = 1,400,000
      expect(result.totalAmount?.amount).toBe(1400000)
      expect(result.totalAmount?.currency).toBe('KRW')
    })
  })

  describe('국내 발주는 shipmentDate 없어도 OK', () => {
    it('DOMESTIC 발주 shipmentDate 없이 생성 성공', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
        // shipmentDate 없음
      })

      expect(result.orderType).toBe('DOMESTIC')
      expect(result.shipmentDate).toBeUndefined()
    })
  })

  describe('베트남 발주는 shipmentDate 필수', () => {
    it('VIETNAM + no shipmentDate → Error', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      await expect(
        useCase.execute({
          partnerId: 'partner-001',
          companyId: 'company-001',
          items,
          orderType: 'VIETNAM',
          // shipmentDate 없음
        })
      ).rejects.toThrow('베트남 발주는 선적일이 필수입니다')
    })

    it('VIETNAM + shipmentDate → 생성 성공', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'VIETNAM',
        shipmentDate: new Date('2025-02-15'),
      })

      expect(result.orderType).toBe('VIETNAM')
      expect(result.shipmentDate).toEqual(new Date('2025-02-15'))
    })
  })

  describe('빈 items 배열 → Error', () => {
    it('items가 빈 배열이면 에러 발생', async () => {
      const items: OrderItem[] = []

      await expect(
        useCase.execute({
          partnerId: 'partner-001',
          companyId: 'company-001',
          items,
          orderType: 'DOMESTIC',
        })
      ).rejects.toThrow('발주 항목이 비어있습니다')
    })
  })

  describe('존재하지 않는 partnerId → Error', () => {
    it('partnerId로 거래처를 찾을 수 없으면 에러 발생', async () => {
      vi.mocked(mockPartnerRepository.findById).mockResolvedValue(null)

      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      await expect(
        useCase.execute({
          partnerId: 'non-existent-partner',
          companyId: 'company-001',
          items,
          orderType: 'DOMESTIC',
        })
      ).rejects.toThrow('존재하지 않는 거래처')
    })
  })

  describe('발주 생성 확인', () => {
    it('생성된 발주가 올바른 속성을 가짐', async () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-001',
          productCode: 'PRD-001',
          productName: 'Wire Harness A',
          quantity: 100,
          unitPrice: Money.create(1000, 'KRW'),
        },
      ]

      const result = await useCase.execute({
        partnerId: 'partner-001',
        companyId: 'company-001',
        items,
        orderType: 'DOMESTIC',
      })

      expect(result.partnerId).toBe('partner-001')
      expect(result.orderType).toBe('DOMESTIC')
      expect(result.totalQuantity).toBe(100)
      expect(result.totalAmount?.amount).toBe(100000)
    })
  })
})
