/**
 * useTransactions Hook
 * 입고/출고 이력 조회 훅
 */

import { useState, useCallback, useEffect } from 'react'
import { GetTransactionsWithDetailsUseCase } from '@application/usecases/GetTransactionsWithDetailsUseCase'
import { GetPartnerSummaryUseCase } from '@application/usecases/GetPartnerSummaryUseCase'
import type {
  TransactionWithDetails,
  TransactionQueryFilter,
  PartnerSummaryResult,
} from '@application/dtos/TransactionWithDetails'

interface UseTransactionsOptions {
  transactionType: 'IN' | 'OUT'
  autoLoad?: boolean
}

interface UseTransactionsReturn {
  transactions: TransactionWithDetails[]
  summary: PartnerSummaryResult
  loading: boolean
  error: string | null
  search: (filter: Omit<TransactionQueryFilter, 'transactionType'>) => Promise<void>
  refresh: () => Promise<void>
}

const getTransactionsUseCase = new GetTransactionsWithDetailsUseCase()
const getPartnerSummaryUseCase = new GetPartnerSummaryUseCase()

export function useTransactions({
  transactionType,
  autoLoad = true,
}: UseTransactionsOptions): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [summary, setSummary] = useState<PartnerSummaryResult>({
    krwSummaries: [],
    foreignSummaries: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<TransactionQueryFilter>({
    transactionType,
    startDate: (() => {
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      return date
    })(),
    endDate: new Date(),
  })

  const search = useCallback(
    async (filter: Omit<TransactionQueryFilter, 'transactionType'>) => {
      setLoading(true)
      setError(null)

      const fullFilter: TransactionQueryFilter = {
        ...filter,
        transactionType,
      }

      try {
        const [txData, summaryData] = await Promise.all([
          getTransactionsUseCase.execute(fullFilter),
          getPartnerSummaryUseCase.execute(fullFilter),
        ])

        setTransactions(txData)
        setSummary(summaryData)
        setCurrentFilter(fullFilter)
      } catch (err) {
        const message = err instanceof Error ? err.message : '데이터 조회 실패'
        setError(message)
        console.error('조회 실패:', err)
      } finally {
        setLoading(false)
      }
    },
    [transactionType]
  )

  const refresh = useCallback(async () => {
    const { transactionType: _, ...filterWithoutType } = currentFilter
    await search(filterWithoutType)
  }, [currentFilter, search])

  // 초기 로드
  useEffect(() => {
    if (autoLoad) {
      const { transactionType: _, ...filterWithoutType } = currentFilter
      search(filterWithoutType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, transactionType])

  return {
    transactions,
    summary,
    loading,
    error,
    search,
    refresh,
  }
}
