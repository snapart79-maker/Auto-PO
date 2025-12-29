/**
 * useInventoryAdjustment Hook
 * 재고 조정 관리 훅
 *
 * PRD 5.4 재고 조정
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@infrastructure/supabase/client'
import type { AdjustmentType, AdjustmentReason } from '@domain/entities/InventoryAdjustment'

export interface InventoryAdjustmentItem {
  id: string
  adjustmentDate: Date
  productId: string
  productCode: string
  productName: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: AdjustmentReason
  reasonLabel: string
  remarks: string | null
  createdAt: Date
}

export interface InventoryAdjustmentInput {
  adjustmentDate: Date
  productId: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: AdjustmentReason
  remarks?: string
}

export interface AdjustmentFilter {
  startDate?: Date
  endDate?: Date
  productId?: string
  adjustmentType?: AdjustmentType
  reason?: AdjustmentReason
}

const REASON_LABELS: Record<AdjustmentReason, string> = {
  PHYSICAL_COUNT: '실사',
  LOSS: '분실',
  DAMAGE: '파손',
  OTHER: '기타',
}

interface UseInventoryAdjustmentReturn {
  items: InventoryAdjustmentItem[]
  loading: boolean
  error: string | null
  search: (filter: AdjustmentFilter) => Promise<void>
  refresh: () => Promise<void>
  create: (input: InventoryAdjustmentInput) => Promise<void>
  remove: (id: string) => Promise<void>
  summary: {
    totalIncrease: number
    totalDecrease: number
    netAdjustment: number
  }
}

interface AdjustmentRow {
  id: string
  adjustment_date: string
  product_id: string
  adjustment_type: AdjustmentType
  quantity: number
  reason: AdjustmentReason
  remarks: string | null
  created_at: string
  products: { product_code: string; product_name: string } | null
}

export function useInventoryAdjustment(): UseInventoryAdjustmentReturn {
  const [items, setItems] = useState<InventoryAdjustmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<AdjustmentFilter>({})

  const fetchData = useCallback(async (filter: AdjustmentFilter) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('inventory_adjustments')
        .select(`
          id,
          adjustment_date,
          product_id,
          adjustment_type,
          quantity,
          reason,
          remarks,
          created_at,
          products (product_code, product_name)
        `)
        .order('adjustment_date', { ascending: false })

      if (filter.startDate) {
        const startStr = filter.startDate.toISOString().split('T')[0]!
        query = query.gte('adjustment_date', startStr)
      }
      if (filter.endDate) {
        const endStr = filter.endDate.toISOString().split('T')[0]!
        query = query.lte('adjustment_date', endStr)
      }
      if (filter.productId) {
        query = query.eq('product_id', filter.productId)
      }
      if (filter.adjustmentType) {
        query = query.eq('adjustment_type', filter.adjustmentType)
      }
      if (filter.reason) {
        query = query.eq('reason', filter.reason)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw new Error(`재고 조정 조회 실패: ${fetchError.message}`)

      const rows = (data as unknown as AdjustmentRow[]) ?? []
      const mapped: InventoryAdjustmentItem[] = rows.map((row) => ({
        id: row.id,
        adjustmentDate: new Date(row.adjustment_date),
        productId: row.product_id,
        productCode: row.products?.product_code ?? '-',
        productName: row.products?.product_name ?? '-',
        adjustmentType: row.adjustment_type,
        quantity: row.quantity,
        reason: row.reason,
        reasonLabel: REASON_LABELS[row.reason],
        remarks: row.remarks,
        createdAt: new Date(row.created_at),
      }))

      setItems(mapped)
      setCurrentFilter(filter)
    } catch (err) {
      const message = err instanceof Error ? err.message : '재고 조정 조회 실패'
      setError(message)
      console.error('재고 조정 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(
    async (filter: AdjustmentFilter) => {
      await fetchData(filter)
    },
    [fetchData]
  )

  const refresh = useCallback(async () => {
    await fetchData(currentFilter)
  }, [fetchData, currentFilter])

  const create = useCallback(
    async (input: InventoryAdjustmentInput) => {
      setLoading(true)
      setError(null)

      try {
        const row = {
          id: crypto.randomUUID(),
          adjustment_date: input.adjustmentDate.toISOString().split('T')[0]!,
          product_id: input.productId,
          adjustment_type: input.adjustmentType,
          quantity: input.quantity,
          reason: input.reason,
          remarks: input.remarks ?? null,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('inventory_adjustments') as any).insert(row)

        if (insertError) throw new Error(`재고 조정 등록 실패: ${insertError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '재고 조정 등록 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('inventory_adjustments')
          .delete()
          .eq('id', id)

        if (deleteError) throw new Error(`재고 조정 삭제 실패: ${deleteError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '재고 조정 삭제 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  // 초기 로드 (최근 1개월)
  useEffect(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    fetchData({ startDate, endDate })
  }, [fetchData])

  // 요약 계산
  const summary = {
    totalIncrease: items
      .filter((i) => i.adjustmentType === 'INCREASE')
      .reduce((sum, i) => sum + i.quantity, 0),
    totalDecrease: items
      .filter((i) => i.adjustmentType === 'DECREASE')
      .reduce((sum, i) => sum + i.quantity, 0),
    get netAdjustment() {
      return this.totalIncrease - this.totalDecrease
    },
  }

  return {
    items,
    loading,
    error,
    search,
    refresh,
    create,
    remove,
    summary,
  }
}
