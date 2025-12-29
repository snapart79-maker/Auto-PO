/**
 * GetPartnerSummaryUseCase Unit Tests
 * 거래처별 합계 조회 테스트
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { GetPartnerSummaryUseCase } from '@application/usecases/GetPartnerSummaryUseCase'

// Supabase 클라이언트 모킹
vi.mock('@infrastructure/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
  },
}))

import { supabase } from '@infrastructure/supabase/client'

describe('GetPartnerSummaryUseCase', () => {
  let useCase: GetPartnerSummaryUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new GetPartnerSummaryUseCase()
  })

  describe('execute', () => {
    it('거래처별로 합계 계산', async () => {
      const mockData = [
        {
          id: 'tx-1',
          transaction_date: '2025-01-15',
          transaction_type: 'IN',
          partner_id: 'partner-1',
          product_id: 'product-1',
          quantity: 100,
          unit_price: 1000,
          supply_amount: 100000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 100000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-15T00:00:00Z',
          partners: { id: 'partner-1', partner_code: 'SUP-001', partner_name: '공급사A' },
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
        {
          id: 'tx-2',
          transaction_date: '2025-01-16',
          transaction_type: 'IN',
          partner_id: 'partner-1',
          product_id: 'product-2',
          quantity: 200,
          unit_price: 2000,
          supply_amount: 400000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 400000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-16T00:00:00Z',
          partners: { id: 'partner-1', partner_code: 'SUP-001', partner_name: '공급사A' },
          products: { id: 'product-2', product_code: 'PROD-002', product_name: '제품B' },
        },
        {
          id: 'tx-3',
          transaction_date: '2025-01-17',
          transaction_type: 'IN',
          partner_id: 'partner-2',
          product_id: 'product-1',
          quantity: 50,
          unit_price: 1000,
          supply_amount: 50000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 50000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-17T00:00:00Z',
          partners: { id: 'partner-2', partner_code: 'SUP-002', partner_name: '공급사B' },
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: mockData, error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result.krwSummaries).toHaveLength(2)

      // 공급사A: 100 + 200 = 300, 100000 + 400000 = 500000
      const supplierA = result.krwSummaries.find(s => s.partnerName === '공급사A')
      expect(supplierA?.totalQuantity).toBe(300)
      expect(supplierA?.totalAmount).toBe(500000)

      // 공급사B: 50, 50000
      const supplierB = result.krwSummaries.find(s => s.partnerName === '공급사B')
      expect(supplierB?.totalQuantity).toBe(50)
      expect(supplierB?.totalAmount).toBe(50000)
    })

    it('원화/외화 분리', async () => {
      const mockData = [
        {
          id: 'tx-1',
          transaction_date: '2025-01-15',
          transaction_type: 'IN',
          partner_id: 'partner-1',
          product_id: 'product-1',
          quantity: 100,
          unit_price: 1000,
          supply_amount: 100000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 100000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-15T00:00:00Z',
          partners: { id: 'partner-1', partner_code: 'SUP-001', partner_name: '국내공급사' },
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
        {
          id: 'tx-2',
          transaction_date: '2025-01-16',
          transaction_type: 'IN',
          partner_id: 'partner-2',
          product_id: 'product-2',
          quantity: 50,
          unit_price: 10,
          supply_amount: 500,
          currency: 'USD',
          exchange_rate: 1300,
          total_amount: 650000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-16T00:00:00Z',
          partners: { id: 'partner-2', partner_code: 'SUP-VN', partner_name: '베트남공급사' },
          products: { id: 'product-2', product_code: 'PROD-002', product_name: '제품B' },
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: mockData, error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result.krwSummaries).toHaveLength(1)
      expect(result.foreignSummaries).toHaveLength(1)

      expect(result.krwSummaries[0]?.partnerName).toBe('국내공급사')
      expect(result.krwSummaries[0]?.currency).toBe('KRW')

      expect(result.foreignSummaries[0]?.partnerName).toBe('베트남공급사')
      expect(result.foreignSummaries[0]?.currency).toBe('USD')
    })

    it('파트너 ID 없는 트랜잭션은 제외', async () => {
      const mockData = [
        {
          id: 'tx-1',
          transaction_date: '2025-01-15',
          transaction_type: 'IN',
          partner_id: null,
          product_id: 'product-1',
          quantity: 100,
          unit_price: 1000,
          supply_amount: 100000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 100000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-15T00:00:00Z',
          partners: null,
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: mockData, error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result.krwSummaries).toHaveLength(0)
      expect(result.foreignSummaries).toHaveLength(0)
    })

    it('금액 내림차순 정렬', async () => {
      const mockData = [
        {
          id: 'tx-1',
          transaction_date: '2025-01-15',
          transaction_type: 'IN',
          partner_id: 'partner-1',
          product_id: 'product-1',
          quantity: 10,
          unit_price: 1000,
          supply_amount: 10000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 10000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-15T00:00:00Z',
          partners: { id: 'partner-1', partner_code: 'SUP-001', partner_name: '작은거래처' },
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
        {
          id: 'tx-2',
          transaction_date: '2025-01-16',
          transaction_type: 'IN',
          partner_id: 'partner-2',
          product_id: 'product-1',
          quantity: 1000,
          unit_price: 1000,
          supply_amount: 1000000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 1000000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-16T00:00:00Z',
          partners: { id: 'partner-2', partner_code: 'SUP-002', partner_name: '큰거래처' },
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '제품A' },
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: mockData, error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result.krwSummaries).toHaveLength(2)
      // 금액 내림차순: 큰거래처(1000000) > 작은거래처(10000)
      expect(result.krwSummaries[0]?.partnerName).toBe('큰거래처')
      expect(result.krwSummaries[1]?.partnerName).toBe('작은거래처')
    })

    it('빈 데이터일 때 빈 결과 반환', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: [], error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result.krwSummaries).toHaveLength(0)
      expect(result.foreignSummaries).toHaveLength(0)
    })
  })
})
