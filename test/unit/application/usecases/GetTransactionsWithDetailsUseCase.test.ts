/**
 * GetTransactionsWithDetailsUseCase Unit Tests
 * 거래처/제품 정보가 포함된 입출고 이력 조회 테스트
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { GetTransactionsWithDetailsUseCase } from '@application/usecases/GetTransactionsWithDetailsUseCase'
import type { TransactionQueryFilter } from '@application/dtos/TransactionWithDetails'

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

describe('GetTransactionsWithDetailsUseCase', () => {
  let useCase: GetTransactionsWithDetailsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new GetTransactionsWithDetailsUseCase()
  })

  describe('execute', () => {
    it('빈 필터로 조회 시 전체 데이터 반환', async () => {
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
          item_type: '원재료',
          upload_batch_id: null,
          created_at: '2025-01-15T00:00:00Z',
          partners: {
            id: 'partner-1',
            partner_code: 'SUP-001',
            partner_name: '테스트 공급사',
          },
          products: {
            id: 'product-1',
            product_code: 'PROD-001',
            product_name: '테스트 제품',
          },
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

      expect(result).toHaveLength(1)
      expect(result[0]?.partnerName).toBe('테스트 공급사')
      expect(result[0]?.productName).toBe('테스트 제품')
      expect(result[0]?.transactionType).toBe('IN')
    })

    it('transactionType 필터 적용', async () => {
      const mockData: unknown[] = []
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

      const filter: TransactionQueryFilter = {
        transactionType: 'IN',
      }

      await useCase.execute(filter)

      expect(mockQuery.eq).toHaveBeenCalledWith('transaction_type', 'IN')
    })

    it('날짜 범위 필터 적용', async () => {
      const mockData: unknown[] = []
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

      const filter: TransactionQueryFilter = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      }

      await useCase.execute(filter)

      expect(mockQuery.gte).toHaveBeenCalledWith('transaction_date', '2025-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('transaction_date', '2025-01-31')
    })

    it('품번 필터 적용 (복수 코드)', async () => {
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

      const filter: TransactionQueryFilter = {
        productCodes: ['PROD-001'],
      }

      const result = await useCase.execute(filter)

      expect(result).toHaveLength(1)
      expect(result[0]?.productCode).toBe('PROD-001')
    })

    it('품명 필터 적용 (부분 검색)', async () => {
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
          products: { id: 'product-1', product_code: 'PROD-001', product_name: '테스트 제품' },
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
          products: { id: 'product-2', product_code: 'PROD-002', product_name: '다른 물품' },
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

      const filter: TransactionQueryFilter = {
        productName: '테스트',
      }

      const result = await useCase.execute(filter)

      expect(result).toHaveLength(1)
      expect(result[0]?.productName).toBe('테스트 제품')
    })

    it('거래처 필터 적용', async () => {
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
          partner_id: 'partner-2',
          product_id: 'product-1',
          quantity: 200,
          unit_price: 1000,
          supply_amount: 200000,
          currency: 'KRW',
          exchange_rate: null,
          total_amount: 200000,
          item_type: null,
          upload_batch_id: null,
          created_at: '2025-01-16T00:00:00Z',
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

      const filter: TransactionQueryFilter = {
        partnerCodes: ['공급사A'],
      }

      const result = await useCase.execute(filter)

      expect(result).toHaveLength(1)
      expect(result[0]?.partnerName).toBe('공급사A')
    })

    it('조회 에러 시 예외 발생', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      await expect(useCase.execute({})).rejects.toThrow('입출고 이력 조회 실패')
    })

    it('data가 null이면 빈 배열 반환', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      mockQuery.order.mockResolvedValue({ data: null, error: null })

      const fromMock = supabase.from as MockedFunction<typeof supabase.from>
      fromMock.mockReturnValue(mockQuery as ReturnType<typeof supabase.from>)

      const result = await useCase.execute({})

      expect(result).toEqual([])
    })
  })
})
